import { Router } from 'express';
import { getRepository } from 'typeorm';
import { Dataset } from '../entity/Dataset';
import { User, UserRole } from '../entity/User';
import { checkJwt, checkJwtOptional } from '../middleware/checkJwt';
import { Brackets } from 'typeorm';
import * as multer from 'multer';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { DatasetImage } from '../entity/DatasetImage';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create a new dataset
router.post('/', [checkJwt], async (req, res) => {
    const { name, description, isPublic } = req.body;
    const { userId, role } = res.locals.jwtPayload;

    if (role !== UserRole.ADMIN && role !== UserRole.DEVELOPER) {
        return res.status(403).send('Forbidden');
    }

    if (!name) {
        return res.status(400).send('Dataset name is required');
    }

    const userRepository = getRepository(User);
    const datasetRepository = getRepository(Dataset);

    try {
        const owner = await userRepository.findOneOrFail(userId);

        const dataset = new Dataset();
        dataset.name = name;
        dataset.description = description;
        dataset.isPublic = isPublic ?? true;
        dataset.user = owner;

        await datasetRepository.save(dataset);

        res.status(201).json(dataset);
    } catch (error) {
        res.status(500).send('Error creating dataset');
    }
});

// Get all datasets
router.get('/', [checkJwtOptional], async (req, res) => {
    const { userId, role } = res.locals.jwtPayload || {};
    const datasetRepository = getRepository(Dataset);

    try {
        const query = datasetRepository.createQueryBuilder('dataset')
            .leftJoinAndSelect('dataset.user', 'user')
            .loadRelationCountAndMap('dataset.imageCount', 'dataset.images')
            .where('dataset.isPublic = :isPublic', { isPublic: true });

        if (userId) {
            if (role === UserRole.ADMIN) {
                // Admin sees all datasets, so we remove the public constraint
                query.where('1=1');
            } else {
                query.orWhere(
                    new Brackets(qb => {
                        qb.where('dataset.isPublic = :isPrivate', { isPrivate: false })
                          .andWhere('dataset.userId = :userId', { userId });
                    })
                );
            }
        }

        const datasets = await query.getMany();
        res.json(datasets);
    } catch (error) {
        res.status(500).send('Error fetching datasets');
    }
});

// Get a single dataset
router.get('/:id', [checkJwtOptional], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = res.locals.jwtPayload || {};
    const datasetRepository = getRepository(Dataset);

    try {
        const dataset = await datasetRepository.createQueryBuilder('dataset')
            .leftJoinAndSelect('dataset.user', 'user')
            .loadRelationCountAndMap('dataset.imageCount', 'dataset.images')
            .where("dataset.id = :id", { id })
            .getOne();

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (!dataset.isPublic) {
            if (!userId || (role !== UserRole.ADMIN && dataset.userId !== userId)) {
                return res.status(403).send('Forbidden');
            }
        }

        res.json(dataset);
    } catch (error) {
        res.status(500).send('Error fetching dataset');
    }
});

// Update a dataset
router.put('/:id', [checkJwt], async (req, res) => {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;
    const { userId, role } = res.locals.jwtPayload;
    const datasetRepository = getRepository(Dataset);

    try {
        const dataset = await datasetRepository.findOne(id);

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (role !== UserRole.ADMIN && dataset.userId !== userId) {
            // Developers can only edit their own datasets
            if (role === UserRole.DEVELOPER && dataset.userId !== userId) {
                return res.status(403).send('Forbidden: Developers can only edit their own datasets');
            }
            // Other roles are implicitly forbidden if they are not the owner or an admin
            if (role !== UserRole.DEVELOPER) {
                 return res.status(403).send('Forbidden');
            }
        }

        dataset.name = name ?? dataset.name;
        dataset.description = description ?? dataset.description;
        dataset.isPublic = isPublic ?? dataset.isPublic;

        await datasetRepository.save(dataset);
        res.json(dataset);
    } catch (error) {
        res.status(500).send('Error updating dataset');
    }
});

// Delete a dataset
router.delete('/:id', [checkJwt], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = res.locals.jwtPayload;
    const datasetRepository = getRepository(Dataset);

    try {
        const dataset = await datasetRepository.findOne(id);

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (role !== UserRole.ADMIN && dataset.userId !== userId) {
             if (role === UserRole.DEVELOPER && dataset.userId !== userId) {
                return res.status(403).send('Forbidden: Developers can only delete their own datasets');
            }
             if (role !== UserRole.DEVELOPER) {
                 return res.status(403).send('Forbidden');
            }
        }

        await datasetRepository.remove(dataset);
        res.status(204).send();
    } catch (error) {
        res.status(500).send('Error deleting dataset');
    }
});

// Upload images to a dataset
router.post('/:id/upload', [checkJwt, upload.single('file')], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = res.locals.jwtPayload;

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const datasetRepository = getRepository(Dataset);
    const datasetImageRepository = getRepository(DatasetImage);

    try {
        const dataset = await datasetRepository.findOne(id);

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        // Authorization check
        if (role !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).send('Forbidden');
        }
        
        const images: DatasetImage[] = [];
        let row_number = 0;

        const readable = new Readable();
        readable._read = () => {}; // _read is required but you can noop it
        readable.push(req.file.buffer);
        readable.push(null);

        readable.pipe(csv())
            .on('data', (data) => {
                const { filename, url, width, height, prompt } = data;
                if(filename && url && width && height && prompt) {
                    const newImage = new DatasetImage();
                    newImage.filename = filename;
                    newImage.url = url;
                    newImage.width = parseInt(width, 10);
                    newImage.height = parseInt(height, 10);
                    newImage.prompt = prompt;
                    newImage.row_number = ++row_number;
                    newImage.dataset = dataset;
                    images.push(newImage);
                }
            })
            .on('end', async () => {
                try {
                    await datasetImageRepository.save(images);
                    res.status(201).send({ message: `Successfully uploaded ${images.length} images to dataset ${dataset.name}` });
                } catch (dbError) {
                    res.status(500).send('Error saving images to database');
                }
            })
            .on('error', (err) => {
                 res.status(500).send('Error processing CSV file');
            });
            
    } catch (error) {
        res.status(500).send('Error processing upload');
    }
});

// Get images for a dataset with pagination
router.get('/:id/images', [checkJwtOptional], async (req, res) => {
    const { id } = req.params;
    const { userId, role } = res.locals.jwtPayload || {};
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const datasetRepository = getRepository(Dataset);
    const datasetImageRepository = getRepository(DatasetImage);

    try {
        const dataset = await datasetRepository.findOne(id);

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        // Authorization check for private datasets
        if (!dataset.isPublic) {
            if (!userId || (role !== UserRole.ADMIN && dataset.userId !== userId)) {
                return res.status(403).send('Forbidden');
            }
        }

        const [images, total] = await datasetImageRepository.findAndCount({
            where: { dataset: { id } },
            order: { row_number: 'ASC' },
            skip,
            take: limit,
        });

        res.json({
            data: images,
            total,
            page,
            last_page: Math.ceil(total / limit)
        });

    } catch (error) {
        res.status(500).send('Error fetching dataset images');
    }
});


export default router;
