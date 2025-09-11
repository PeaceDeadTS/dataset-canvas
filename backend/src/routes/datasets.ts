import { Router, Request, Response } from 'express';
import { Brackets } from 'typeorm';
import csv from 'csv-parser';
import { Readable } from 'stream';
import multer from 'multer';
import { randomUUID } from 'crypto';

import { AppDataSource } from '../data-source';
import { Dataset } from '../entity/Dataset.entity';
import { User, UserRole } from '../entity/User.entity';
import { checkJwt, checkJwtOptional } from '../middleware/checkJwt';
import { DatasetImage } from '../entity/DatasetImage.entity';
import logger from '../logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const datasetRepository = AppDataSource.getRepository(Dataset);
const userRepository = AppDataSource.getRepository(User);
const imageRepository = AppDataSource.getRepository(DatasetImage);

// GET /api/datasets - Get all visible datasets with optional sorting
router.get('/', checkJwtOptional, async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const userRole = req.user?.role;
  const { sortBy = 'createdAt', order = 'DESC' } = req.query;

  try {
    const validSortFields = ['name', 'createdAt', 'imageCount', 'username'];
    const validOrder = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    const sortOrder = validOrder.includes((order as string)?.toUpperCase()) ? (order as string).toUpperCase() as 'ASC' | 'DESC' : 'DESC';

    let query = datasetRepository
      .createQueryBuilder('dataset')
      .leftJoinAndSelect('dataset.user', 'user')
      .loadRelationCountAndMap('dataset.imageCount', 'dataset.images');

    // Apply visibility filters
    if (userRole === UserRole.ADMIN) {
      // Admin sees everything
    } else if (userId) {
      // Logged in user sees public datasets AND their own private datasets
      query.where(new Brackets(qb => {
        qb.where('dataset.isPublic = :isPublic', { isPublic: true })
          .orWhere('dataset.userId = :userId', { userId });
      }));
    } else {
      // Anonymous user sees only public datasets
      query.where('dataset.isPublic = :isPublic', { isPublic: true });
    }

    // Apply sorting
    if (sortField === 'imageCount') {
      // For image count sorting, we need to use a subquery or handle after data retrieval
      const datasets = await query.getMany();
      const sorted = datasets.sort((a, b) => {
        const aCount = (a as any).imageCount || 0;
        const bCount = (b as any).imageCount || 0;
        return sortOrder === 'ASC' ? aCount - bCount : bCount - aCount;
      });
      res.json(sorted);
    } else if (sortField === 'username') {
      query.orderBy('user.username', sortOrder);
      const datasets = await query.getMany();
      res.json(datasets);
    } else if (sortField === 'name') {
      query.orderBy('dataset.name', sortOrder);
      const datasets = await query.getMany();
      res.json(datasets);
    } else {
      query.orderBy('dataset.createdAt', sortOrder);
      const datasets = await query.getMany();
      res.json(datasets);
    }
  } catch (error) {
    logger.error('Failed to get datasets', { error });
    res.status(500).send('Internal Server Error');
  }
});

// GET /api/datasets/:id - Get a single dataset by ID
router.get('/:id', checkJwtOptional, async (req: Request, res: Response) => {
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

    const isOwner = dataset.userId === userId;
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
router.post('/', checkJwt, async (req: Request, res: Response) => {
  logger.info('Create dataset endpoint hit', { body: req.body, user: req.user });

  if (!req.user) {
    return res.status(403).send('Authentication required to create datasets');
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
    
    // Важно: загружаем датасет с user relation для корректного ответа
    const savedDataset = await datasetRepository.findOne({
      where: { id: dataset.id },
      relations: ['user'],
    });
    
    res.status(201).json(savedDataset);
  } catch (error: any) {
    logger.error('Failed to create dataset', { 
      errorMessage: error.message, 
      errorStack: error.stack,
      error: error 
    });
    res.status(500).send('Internal Server Error');
  }
});

// POST /api/datasets/:id/upload
router.post('/:id/upload', checkJwt, upload.single('file'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const dataset = await datasetRepository.findOne({ where: { id } });
        if (!dataset) {
            return res.status(404).send('Dataset not found.');
        }

        // Authorization check
        if (userRole !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).send('Forbidden');
        }

        // Overwrite Logic
        await imageRepository.delete({ dataset: { id: dataset.id } });
        
        const images: DatasetImage[] = [];
        
        if (!req.file || !req.file.buffer) {
            return res.status(400).send('No file content.');
        }

        const readable = Readable.from(req.file.buffer);
        let rowCounter = 1;

        readable
            .pipe(csv())
            .on('data', (row) => {
                // Manually create and assign properties for type safety
                const newImage = new DatasetImage();
                newImage.img_key = randomUUID();
                newImage.row_number = rowCounter++;
                newImage.filename = row.filename;
                newImage.url = row.url;
                newImage.width = row.width ? parseInt(row.width, 10) : 0;
                newImage.height = row.height ? parseInt(row.height, 10) : 0;
                newImage.prompt = row.prompt;
                newImage.dataset = dataset;
                images.push(newImage);
            })
            .on('end', async () => {
                try {
                    await imageRepository.save(images);
                    res.status(201).send({ message: `Successfully uploaded ${images.length} images to dataset ${dataset.name}` });
                } catch (dbError) {
                    logger.error(`DB error during CSV save for dataset ${id}`, { error: dbError });
                    res.status(500).send('Error saving images to database.');
                }
            });
    } catch (error) {
        logger.error(`Upload failed for dataset ${id}`, { error });
        res.status(500).send('Internal Server Error');
    }
});

// PUT /api/datasets/:id - Update a dataset
router.put('/:id', checkJwt, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, isPublic } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        const dataset = await datasetRepository.findOne({ where: { id }});
        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (userRole !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).send('Access denied');
        }

        dataset.name = name ?? dataset.name;
        dataset.description = description ?? dataset.description;
        dataset.isPublic = isPublic ?? dataset.isPublic;

        await datasetRepository.save(dataset);
        res.json(dataset);

    } catch (error) {
        logger.error(`Failed to update dataset ${id}`, { error });
        res.status(500).send('Internal Server Error');
    }
});


// DELETE /api/datasets/:id - Delete a dataset
router.delete('/:id', checkJwt, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        const dataset = await datasetRepository.findOne({ where: { id }});
        if (!dataset) {
            return res.status(404).send('Dataset not found');
        }

        if (userRole !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).send('Access denied');
        }

        await datasetRepository.remove(dataset);
        res.status(204).send();

    } catch (error) {
        logger.error(`Failed to delete dataset ${id}`, { error });
        res.status(500).send('Internal Server Error');
    }
});

// DELETE /api/datasets/:id/admin - Admin force delete any dataset
router.delete('/:id/admin', checkJwt, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userRole = req.user?.role;
    const adminId = req.user?.userId;

    // Only administrators can force delete any dataset
    if (userRole !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied. Admin rights required.' });
    }

    try {
        const dataset = await datasetRepository.findOne({ 
            where: { id },
            relations: ['user', 'images']
        });
        
        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        const datasetName = dataset.name;
        const datasetOwner = dataset.user.username;
        const imageCount = dataset.images?.length || 0;

        await datasetRepository.remove(dataset);

        logger.info(`Dataset force deleted by admin`, { 
            datasetId: id,
            datasetName,
            datasetOwner,
            imageCount,
            adminId 
        });

        res.json({ 
            message: `Dataset "${datasetName}" (owned by ${datasetOwner}) and its ${imageCount} images have been deleted successfully` 
        });

    } catch (error) {
        logger.error(`Failed to admin delete dataset ${id}`, { error });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


export default router;
