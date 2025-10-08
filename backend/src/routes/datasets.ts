import { Router, Request, Response } from 'express';
import { Brackets } from 'typeorm';
import csv from 'csv-parser';
import { Readable } from 'stream';
import multer from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { AppDataSource } from '../data-source';
import { Dataset } from '../entity/Dataset.entity';
import { User, UserRole } from '../entity/User.entity';
import { checkJwt, checkJwtOptional } from '../middleware/checkJwt';
import { DatasetImage } from '../entity/DatasetImage.entity';
import { DatasetFile } from '../entity/DatasetFile.entity';
import { CaptionEditHistory } from '../entity/CaptionEditHistory.entity';
import { checkPermission } from '../middleware/checkPermission';
import { PermissionType } from '../entity/Permission.entity';
import { Like } from '../entity/Like.entity';
import { Discussion } from '../entity/Discussion.entity';
import { DiscussionPost } from '../entity/DiscussionPost.entity';
import logger from '../logger';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const datasetRepository = AppDataSource.getRepository(Dataset);
const userRepository = AppDataSource.getRepository(User);
const imageRepository = AppDataSource.getRepository(DatasetImage);
const fileRepository = AppDataSource.getRepository(DatasetFile);

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
      order: { row_number: 'ASC' },
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

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename for the CSV file
        const fileExtension = path.extname(req.file.originalname) || '.csv';
        const uniqueFilename = `${dataset.id}_${Date.now()}_${randomUUID()}${fileExtension}`;
        const filePath = path.join(uploadsDir, uniqueFilename);

        // Save the CSV file to disk
        fs.writeFileSync(filePath, req.file.buffer);

        // Save file metadata to database
        const datasetFile = new DatasetFile();
        datasetFile.filename = uniqueFilename;
        datasetFile.originalName = req.file.originalname;
        datasetFile.mimeType = req.file.mimetype;
        datasetFile.size = req.file.size;
        datasetFile.filePath = filePath;
        datasetFile.description = 'Original CSV upload';
        datasetFile.dataset = dataset;
        datasetFile.datasetId = dataset.id;

        await fileRepository.save(datasetFile);

        // Smart Update Logic - preserve img_key for existing images
        // Step 1: Load all existing images into a Map by URL for quick lookup
        const existingImages = await imageRepository.find({
            where: { dataset: { id: dataset.id } }
        });
        
        const existingImagesByUrl = new Map<string, DatasetImage>();
        const existingImagesByImgKey = new Map<string, DatasetImage>();
        
        existingImages.forEach(img => {
            if (img.url) {
                existingImagesByUrl.set(img.url, img);
            }
            if (img.img_key) {
                existingImagesByImgKey.set(img.img_key, img);
            }
        });

        const imagesToSave: DatasetImage[] = [];
        const processedUrls = new Set<string>();
        
        if (!req.file || !req.file.buffer) {
            return res.status(400).send('No file content.');
        }

        const readable = Readable.from(req.file.buffer);
        let rowCounter = 1;

        readable
            .pipe(csv())
            .on('data', (row) => {
                const url = row.url;
                const csvImgKey = row.img_key; // Check if CSV contains img_key column
                
                let imageToUpdate: DatasetImage | undefined;

                // Step 2: Try to find existing image
                // Priority 1: Match by img_key from CSV (if provided)
                if (csvImgKey && existingImagesByImgKey.has(csvImgKey)) {
                    imageToUpdate = existingImagesByImgKey.get(csvImgKey);
                }
                // Priority 2: Match by URL
                else if (url && existingImagesByUrl.has(url)) {
                    imageToUpdate = existingImagesByUrl.get(url);
                }

                // Step 3: Update existing image or create new one
                if (imageToUpdate) {
                    // Update existing image, preserving img_key and id
                    imageToUpdate.row_number = rowCounter++;
                    imageToUpdate.filename = row.filename || imageToUpdate.filename;
                    imageToUpdate.url = url || imageToUpdate.url;
                    imageToUpdate.width = row.width ? parseInt(row.width, 10) : imageToUpdate.width;
                    imageToUpdate.height = row.height ? parseInt(row.height, 10) : imageToUpdate.height;
                    imageToUpdate.prompt = row.prompt !== undefined ? row.prompt : imageToUpdate.prompt;
                    imagesToSave.push(imageToUpdate);
                    processedUrls.add(url);
                } else {
                    // Create new image with new img_key
                    const newImage = new DatasetImage();
                    newImage.img_key = csvImgKey || randomUUID(); // Use CSV img_key if provided
                    newImage.row_number = rowCounter++;
                    newImage.filename = row.filename;
                    newImage.url = url;
                    newImage.width = row.width ? parseInt(row.width, 10) : 0;
                    newImage.height = row.height ? parseInt(row.height, 10) : 0;
                    newImage.prompt = row.prompt || '';
                    newImage.dataset = dataset;
                    imagesToSave.push(newImage);
                    processedUrls.add(url);
                }
            })
            .on('end', async () => {
                try {
                    // Step 4: Save all images (updates + new ones)
                    await imageRepository.save(imagesToSave);

                    // Step 5: Delete images that are no longer in the CSV
                    const imagesToDelete = existingImages.filter(img => 
                        img.url && !processedUrls.has(img.url)
                    );
                    
                    if (imagesToDelete.length > 0) {
                        await imageRepository.remove(imagesToDelete);
                        logger.info(`Removed ${imagesToDelete.length} images that are no longer in CSV for dataset ${dataset.name}`);
                    }

                    const updatedCount = imagesToSave.filter(img => img.id).length;
                    const newCount = imagesToSave.length - updatedCount;

                    logger.info(`Successfully uploaded CSV file ${uniqueFilename} to dataset ${dataset.name}. Updated: ${updatedCount}, New: ${newCount}, Deleted: ${imagesToDelete.length}`);
                    res.status(201).send({ 
                        message: `Successfully uploaded ${imagesToSave.length} images to dataset ${dataset.name}`,
                        stats: {
                            total: imagesToSave.length,
                            updated: updatedCount,
                            new: newCount,
                            deleted: imagesToDelete.length
                        },
                        fileId: datasetFile.id,
                        filename: datasetFile.originalName
                    });
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

// GET /api/datasets/:id/files - Get files for a dataset
router.get('/:id/files', checkJwtOptional, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        const dataset = await datasetRepository.findOne({
            where: { id },
            relations: ['user', 'files']
        });

        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        // Check visibility permissions
        if (!dataset.isPublic && userRole !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Return files data without file paths for security
        const filesData = dataset.files.map(file => ({
            id: file.id,
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            description: file.description,
            createdAt: file.createdAt,
            updatedAt: file.updatedAt
        }));

        res.json({ files: filesData });

    } catch (error) {
        logger.error(`Failed to get files for dataset ${id}`, { error });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /api/datasets/:id/files/:fileId/download - Download a specific file
router.get('/:id/files/:fileId/download', checkJwtOptional, async (req: Request, res: Response) => {
    const { id, fileId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        const dataset = await datasetRepository.findOne({
            where: { id },
            relations: ['user']
        });

        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        // Check visibility permissions
        if (!dataset.isPublic && userRole !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const file = await fileRepository.findOne({
            where: { id: parseInt(fileId), datasetId: dataset.id }
        });

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Check if file exists on disk
        if (!fs.existsSync(file.filePath)) {
            logger.error(`File not found on disk: ${file.filePath}`);
            return res.status(404).json({ error: 'File not found on disk' });
        }

        // Set headers for file download
        res.setHeader('Content-Type', file.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Length', file.size);

        // Stream the file
        const fileStream = fs.createReadStream(file.filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            logger.error(`Error streaming file ${file.filePath}`, { error });
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error downloading file' });
            }
        });

    } catch (error) {
        logger.error(`Failed to download file ${fileId} for dataset ${id}`, { error });
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// GET /api/datasets/:id/statistics - Get dataset statistics
router.get('/:id/statistics', checkJwtOptional, async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
        const dataset = await datasetRepository.findOne({
            where: { id },
            relations: ['user']
        });

        if (!dataset) {
            return res.status(404).json({ error: 'Dataset not found' });
        }

        // Check visibility permissions
        if (!dataset.isPublic && userRole !== UserRole.ADMIN && dataset.userId !== userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get all images for statistics calculation
        const images = await imageRepository.find({
            where: { dataset: { id } }
        });

        const totalSamples = images.length;

        if (totalSamples === 0) {
            return res.json({
                totalSamples: 0,
                resolutionStats: [],
                avgPromptLength: 0,
                divisibilityCheck: {
                    allDivisibleBy64: true,
                    divisibleCount: 0,
                    totalCount: 0
                }
            });
        }

        // Calculate resolution statistics
        const resolutionMap = new Map<string, number>();
        let totalPromptLength = 0;
        let promptCount = 0;
        let divisibleBy64Count = 0;

        images.forEach(image => {
            // Resolution statistics
            const resolution = `${image.width}x${image.height}`;
            resolutionMap.set(resolution, (resolutionMap.get(resolution) || 0) + 1);

            // Prompt length statistics
            if (image.prompt && image.prompt.trim()) {
                totalPromptLength += image.prompt.length;
                promptCount++;
            }

            // Divisibility by 64 check
            if (image.width % 64 === 0 && image.height % 64 === 0) {
                divisibleBy64Count++;
            }
        });

        // Convert resolution map to sorted array with percentages
        const resolutionStats = Array.from(resolutionMap.entries())
            .map(([resolution, count]) => ({
                resolution,
                count,
                percentage: Math.round((count / totalSamples) * 100 * 100) / 100 // Round to 2 decimal places
            }))
            .sort((a, b) => b.count - a.count); // Sort by count descending

        // Calculate average prompt length
        const avgPromptLength = promptCount > 0 
            ? Math.round((totalPromptLength / promptCount) * 100) / 100 
            : 0;

        // Divisibility check
        const allDivisibleBy64 = divisibleBy64Count === totalSamples;

        const statistics = {
            totalSamples,
            resolutionStats,
            avgPromptLength,
            divisibilityCheck: {
                allDivisibleBy64,
                divisibleCount: divisibleBy64Count,
                totalCount: totalSamples
            }
        };

        res.json(statistics);

    } catch (error) {
        logger.error(`Failed to get statistics for dataset ${id}`, { error });
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

/**
 * PUT /api/datasets/:datasetId/images/:imageId/caption
 * Редактировать caption изображения (требуется право edit_caption)
 */
router.put(
  '/:datasetId/images/:imageId/caption',
  checkJwt,
  checkPermission(PermissionType.EDIT_CAPTION),
  async (req: Request, res: Response) => {
    const { datasetId, imageId } = req.params;
    const { caption } = req.body;
    const userId = req.user!.userId;

    if (caption === undefined || caption === null) {
      return res.status(400).json({ 
        message: 'Необходимо указать новый caption' 
      });
    }

    try {
      // Проверяем существование датасета
      const dataset = await datasetRepository.findOne({
        where: { id: datasetId },
      });

      if (!dataset) {
        return res.status(404).json({ message: 'Датасет не найден' });
      }

      // Получаем изображение
      const image = await imageRepository.findOne({
        where: { 
          id: parseInt(imageId),
          dataset: { id: datasetId },
        },
        relations: ['dataset'],
      });

      if (!image) {
        return res.status(404).json({ message: 'Изображение не найдено' });
      }

      const oldCaption = image.prompt;

      // Проверяем, изменился ли caption
      if (oldCaption === caption) {
        return res.status(400).json({ 
          message: 'Новый caption идентичен текущему' 
        });
      }

      // Сохраняем историю изменений
      const historyRepository = AppDataSource.manager.getRepository(CaptionEditHistory);
      const historyEntry = historyRepository.create({
        imageId: image.id,
        userId: userId,
        oldCaption: oldCaption,
        newCaption: caption,
      });
      await historyRepository.save(historyEntry);

      // Обновляем caption
      image.prompt = caption;
      await imageRepository.save(image);

      logger.info('Caption edited', {
        userId,
        username: req.user?.username,
        datasetId,
        imageId,
      });

      res.json({ 
        message: 'Caption успешно обновлен',
        image: {
          id: image.id,
          caption: image.prompt,
        }
      });
    } catch (error) {
      logger.error('Error editing caption', { error, datasetId, imageId });
      res.status(500).json({ message: 'Ошибка при редактировании caption' });
    }
  }
);

/**
 * GET /api/datasets/:datasetId/images/:imageId/caption-history
 * Получить историю правок caption изображения
 */
router.get(
  '/:datasetId/images/:imageId/caption-history',
  checkJwtOptional,
  async (req: Request, res: Response) => {
    const { datasetId, imageId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
      // Проверяем существование датасета
      const dataset = await datasetRepository.findOne({
        where: { id: datasetId },
      });

      if (!dataset) {
        return res.status(404).json({ message: 'Датасет не найден' });
      }

      // Проверяем доступ к датасету
      const isAdmin = userRole === UserRole.ADMIN;
      const isOwner = userId && dataset.userId === userId;
      const isPublic = dataset.isPublic;

      if (!isPublic && !isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: 'Доступ к этому датасету запрещен' 
        });
      }

      // Получаем изображение
      const image = await imageRepository.findOne({
        where: { 
          id: parseInt(imageId),
          dataset: { id: datasetId },
        },
      });

      if (!image) {
        return res.status(404).json({ message: 'Изображение не найдено' });
      }

      // Получаем историю изменений
      const historyRepository = AppDataSource.manager.getRepository(CaptionEditHistory);
      const history = await historyRepository.find({
        where: { imageId: image.id },
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });

      const formattedHistory = history.map(entry => ({
        id: entry.id,
        oldCaption: entry.oldCaption,
        newCaption: entry.newCaption,
        createdAt: entry.createdAt,
        user: entry.user ? {
          id: entry.user.id,
          username: entry.user.username,
        } : null,
      }));

      res.json({
        imageId: image.id,
        currentCaption: image.prompt,
        history: formattedHistory,
      });
    } catch (error) {
      logger.error('Error fetching caption history', { error, datasetId, imageId });
      res.status(500).json({ message: 'Ошибка при получении истории правок' });
    }
  }
);

// POST /api/datasets/:id/likes - Поставить лайк датасету
router.post('/:id/likes', checkJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    // Проверяем существование датасета
    const dataset = await datasetRepository.findOne({ where: { id } });
    if (!dataset) {
      return res.status(404).json({ message: 'Датасет не найден' });
    }

    const likeRepository = AppDataSource.manager.getRepository(Like);

    // Проверяем, не поставлен ли уже лайк
    const existingLike = await likeRepository.findOne({
      where: { userId, datasetId: id }
    });

    if (existingLike) {
      return res.status(400).json({ message: 'Вы уже поставили лайк этому датасету' });
    }

    // Создаем новый лайк
    const like = likeRepository.create({
      userId,
      datasetId: id
    });

    await likeRepository.save(like);

    logger.info('Like created', { datasetId: id, userId });
    res.status(201).json({ message: 'Лайк добавлен', like });
  } catch (error) {
    logger.error('Failed to create like', { error, datasetId: id, userId });
    res.status(500).json({ message: 'Ошибка при добавлении лайка' });
  }
});

// DELETE /api/datasets/:id/likes - Убрать лайк с датасета
router.delete('/:id/likes', checkJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const likeRepository = AppDataSource.manager.getRepository(Like);

    // Ищем лайк
    const like = await likeRepository.findOne({
      where: { userId, datasetId: id }
    });

    if (!like) {
      return res.status(404).json({ message: 'Лайк не найден' });
    }

    await likeRepository.remove(like);

    logger.info('Like removed', { datasetId: id, userId });
    res.json({ message: 'Лайк удален' });
  } catch (error) {
    logger.error('Failed to remove like', { error, datasetId: id, userId });
    res.status(500).json({ message: 'Ошибка при удалении лайка' });
  }
});

// GET /api/datasets/:id/likes - Получить список лайков с пользователями
router.get('/:id/likes', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const likeRepository = AppDataSource.manager.getRepository(Like);

    const likes = await likeRepository.find({
      where: { datasetId: id },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });

    const formattedLikes = likes.map(like => ({
      id: like.id,
      createdAt: like.createdAt,
      user: {
        id: like.user.id,
        username: like.user.username,
        email: like.user.email
      }
    }));

    res.json(formattedLikes);
  } catch (error) {
    logger.error('Failed to fetch likes', { error, datasetId: id });
    res.status(500).json({ message: 'Ошибка при получении лайков' });
  }
});

// GET /api/datasets/:id/contributors - Получить статистику участников обсуждений
router.get('/:id/contributors', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Проверяем существование датасета
    const dataset = await datasetRepository.findOne({ where: { id } });
    if (!dataset) {
      return res.status(404).json({ message: 'Датасет не найден' });
    }

    const discussionRepository = AppDataSource.manager.getRepository(Discussion);
    const postRepository = AppDataSource.manager.getRepository(DiscussionPost);

    // Получаем все дискуссии датасета
    const discussions = await discussionRepository.find({
      where: { datasetId: id },
      relations: ['author']
    });

    if (discussions.length === 0) {
      return res.json([]);
    }

    const discussionIds = discussions.map(d => d.id);

    // Получаем все посты из этих дискуссий
    const posts = await postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.discussionId IN (:...discussionIds)', { discussionIds })
      .andWhere('post.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();

    // Собираем статистику по участникам
    const contributorsMap = new Map<string, {
      user: User;
      discussionsCreated: number;
      postsCount: number;
    }>();

    // Считаем созданные дискуссии
    discussions.forEach(discussion => {
      const userId = discussion.authorId;
      if (!contributorsMap.has(userId)) {
        contributorsMap.set(userId, {
          user: discussion.author,
          discussionsCreated: 0,
          postsCount: 0
        });
      }
      contributorsMap.get(userId)!.discussionsCreated++;
    });

    // Считаем посты
    posts.forEach(post => {
      const userId = post.authorId;
      if (!contributorsMap.has(userId)) {
        contributorsMap.set(userId, {
          user: post.author,
          discussionsCreated: 0,
          postsCount: 0
        });
      }
      contributorsMap.get(userId)!.postsCount++;
    });

    // Форматируем результат
    const contributors = Array.from(contributorsMap.values()).map(contrib => ({
      user: {
        id: contrib.user.id,
        username: contrib.user.username,
        email: contrib.user.email
      },
      discussionsCreated: contrib.discussionsCreated,
      postsCount: contrib.postsCount,
      totalActivity: contrib.discussionsCreated + contrib.postsCount
    }));

    // Сортируем по активности
    contributors.sort((a, b) => b.totalActivity - a.totalActivity);

    res.json(contributors);
  } catch (error) {
    logger.error('Failed to fetch contributors', { error, datasetId: id });
    res.status(500).json({ message: 'Ошибка при получении статистики участников' });
  }
});


export default router;
