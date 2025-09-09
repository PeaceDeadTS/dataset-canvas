import { Router } from 'express';
import { Brackets } from 'typeorm';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { AppDataSource } from '../data-source';
import { Dataset } from '../entity/Dataset.entity';
import { User, UserRole } from '../entity/User.entity';
import { checkJwt, checkJwtOptional } from '../middleware/checkJwt';
import upload from '../middleware/upload';
import { DatasetImage } from '../entity/DatasetImage.entity';
import logger from '../logger';

const router = Router();
const datasetRepository = AppDataSource.getRepository(Dataset);
const userRepository = AppDataSource.getRepository(User);
const imageRepository = AppDataSource.getRepository(DatasetImage);

// GET /api/datasets - Get all visible datasets
router.get('/', checkJwtOptional, async (req, res) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;

  try {
    const query = datasetRepository
      .createQueryBuilder('dataset')
      .leftJoinAndSelect('dataset.user', 'user')
      .select(['dataset.id', 'dataset.name', 'dataset.description', 'dataset.isPublic', 'user.username']);

    if (userRole === UserRole.ADMIN) {
      // Admin sees everything
    } else if (userId) {
      // Logged in user sees public datasets AND their own private datasets
      query.where('dataset.isPublic = :isPublic', { isPublic: true })
           .orWhere('dataset.userId = :userId', { userId });
    } else {
      // Anonymous user sees only public datasets
      query.where('dataset.isPublic = :isPublic', { isPublic: true });
    }

    const datasets = await query.getMany();
    res.json(datasets);
  } catch (error) {
    logger.error('Failed to get datasets', { error });
    res.status(500).send('Internal Server Error');
  }
});

// GET /api/datasets/:id - Get a single dataset by ID
router.get('/:id', checkJwtOptional, async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const { page = 1, limit = 10 } = req.query;

  try {
    const dataset = await datasetRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!dataset) {
      return res.status(404).send('Dataset not found');
    }

    const isOwner = dataset.user.id === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!dataset.isPublic && !isOwner && !isAdmin) {
      return res.status(403).send('Access denied');
    }
    
    const [images, total] = await imageRepository.findAndCount({
      where: { dataset: { id } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    res.json({
      ...dataset,
      images: {
        data: images,
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    logger.error(`Failed to get dataset ${id}`, { error });
    res.status(500).send('Internal Server Error');
  }
});


// POST /api/datasets - Create a new dataset
router.post('/', checkJwt, async (req, res) => {
  if (req.user.role !== UserRole.DEVELOPER && req.user.role !== UserRole.ADMIN) {
    return res.status(403).send('Only developers and admins can create datasets');
  }

  const { name, description, isPublic } = req.body;
  const userId = req.user.userId;

  try {
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      return res.status(404).send('User not found');
    }

    const dataset = datasetRepository.create({
      name,
      description,
      isPublic,
      user,
    });

    await datasetRepository.save(dataset);
    res.status(201).json(dataset);
  } catch (error) {
    logger.error('Failed to create dataset', { error });
    res.status(500).send('Internal Server Error');
  }
});

// POST /api/datasets/:id/upload
router.post('/:id/upload', checkJwt, upload.single('file'), async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const dataset = await datasetRepository.findOne({ where: { id } });

        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        // Authorization check
        if (req.user.role !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).send('Forbidden');
        }

        // --- Overwrite Logic ---
        // Delete all existing images for this dataset before uploading new ones.
        await imageRepository.delete({ dataset: { id: dataset.id } });
        
        const images: DatasetImage[] = [];
        let row_number = 0;

        const readable = new Readable();
        readable._read = () => {}; // _read is required but you can noop it
        readable.push(req.file.buffer);
        readable.push(null);

        readable.pipe(csv())
            .on('data', (data: any) => {
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
                    await imageRepository.save(images);
                    res.status(201).send({ message: `Successfully uploaded ${images.length} images to dataset ${dataset.name}` });
                } catch (dbError) {
                    logger.error('Error saving images to database', { error: dbError, datasetId: id });
                    res.status(500).send('Error saving images to database');
                }
            })
            .on('error', (err: any) => {
                 logger.error('Error processing CSV file', { error: err, datasetId: id });
                 res.status(500).send('Error processing CSV file');
            });
            
    } catch (error) {
        logger.error('Error processing upload', { error, datasetId: id });
        res.status(500).send('Error processing upload');
    }
});

// Get images for a dataset with pagination
router.get('/:id/images', [checkJwtOptional], async (req: Request, res: Response) => {
    const { id } = req.params;
    const { userId, role } = res.locals.jwtPayload || {};
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    const manager = getManager();
    const datasetRepository = manager.getRepository(Dataset);
    const datasetImageRepository = manager.getRepository(DatasetImage);

    try {
        const dataset = await datasetRepository.findOne({ where: { id } });

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
        logger.error('Error fetching dataset images', { error, datasetId: id });
        res.status(500).send('Error fetching dataset images');
    }
});


export default router;
