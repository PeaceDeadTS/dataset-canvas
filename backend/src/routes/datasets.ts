import { Router, Request, Response } from 'express';
import { Brackets } from 'typeorm';
import csv from 'csv-parser';
import { Readable } from 'stream';
import multer from 'multer';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { AppDataSource } from '../data-source';
import { Dataset, DatasetFormat } from '../entity/Dataset.entity';
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
import { parseCOCOJSON, isCocoFormat } from '../utils/cocoParser';

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
    
    // Important: load dataset with user relation for correct response
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

// POST /api/datasets/:id/upload - Supports both CSV and COCO formats
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

        // Detect file format
        const isCoco = isCocoFormat(req.file.buffer);
        const detectedFormat = isCoco ? DatasetFormat.COCO : DatasetFormat.CSV;

        // Check format compatibility - prevent mixing formats
        const existingImageCount = await imageRepository.count({
            where: { dataset: { id: dataset.id } }
        });

        if (existingImageCount > 0 && dataset.format !== detectedFormat) {
            return res.status(400).json({
                error: 'Format mismatch',
                message: `This dataset already contains ${dataset.format.toUpperCase()} data. You cannot upload ${detectedFormat.toUpperCase()} files to a ${dataset.format.toUpperCase()} dataset. Please create a new dataset for ${detectedFormat.toUpperCase()} format.`
            });
        }

        // Update dataset format on first upload
        if (existingImageCount === 0 && dataset.format !== detectedFormat) {
            dataset.format = detectedFormat;
            await datasetRepository.save(dataset);
            logger.info(`Dataset ${dataset.name} format set to ${detectedFormat}`);
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const fileExtension = path.extname(req.file.originalname) || (isCoco ? '.json' : '.csv');
        const uniqueFilename = `${dataset.id}_${Date.now()}_${randomUUID()}${fileExtension}`;
        const filePath = path.join(uploadsDir, uniqueFilename);

        // Save file to disk
        fs.writeFileSync(filePath, req.file.buffer);

        // Save file metadata to database
        const datasetFile = new DatasetFile();
        datasetFile.filename = uniqueFilename;
        datasetFile.originalName = req.file.originalname;
        datasetFile.mimeType = req.file.mimetype;
        datasetFile.size = req.file.size;
        datasetFile.filePath = filePath;
        datasetFile.description = isCoco ? 'Original COCO JSON upload' : 'Original CSV upload';
        datasetFile.dataset = dataset;
        datasetFile.datasetId = dataset.id;

        await fileRepository.save(datasetFile);

        // Load existing images for Smart Update
        const existingImages = await imageRepository.find({
            where: { dataset: { id: dataset.id } }
        });

        let imagesToSave: DatasetImage[] = [];
        let processedUrls = new Set<string>();
        let updatedCount = 0;
        let newCount = 0;
        let deletedCount = 0;

        if (isCoco) {
            // === COCO FORMAT PROCESSING ===
            try {
                const parsedImages = await parseCOCOJSON(req.file.buffer);

                // Build lookup maps for existing images
                const existingImagesByUrl = new Map<string, DatasetImage>();
                const existingImagesByCocoId = new Map<number, DatasetImage>();

                existingImages.forEach(img => {
                    if (img.url) {
                        existingImagesByUrl.set(img.url, img);
                    }
                    if (img.cocoImageId) {
                        existingImagesByCocoId.set(img.cocoImageId, img);
                    }
                });

                // Process parsed COCO images
                parsedImages.forEach((parsedImg, index) => {
                    let imageToUpdate: DatasetImage | undefined;

                    // Try to match by cocoImageId first, then by URL
                    if (existingImagesByCocoId.has(parsedImg.cocoImageId)) {
                        imageToUpdate = existingImagesByCocoId.get(parsedImg.cocoImageId);
                    } else if (existingImagesByUrl.has(parsedImg.url)) {
                        imageToUpdate = existingImagesByUrl.get(parsedImg.url);
                    }

                    if (imageToUpdate) {
                        // Update existing image
                        imageToUpdate.row_number = index + 1;
                        imageToUpdate.filename = parsedImg.filename;
                        imageToUpdate.url = parsedImg.url;
                        imageToUpdate.flickrUrl = parsedImg.flickrUrl;
                        imageToUpdate.width = parsedImg.width;
                        imageToUpdate.height = parsedImg.height;
                        imageToUpdate.prompt = parsedImg.prompt;
                        imageToUpdate.additionalCaptions = parsedImg.additionalCaptions.length > 0 ? parsedImg.additionalCaptions : undefined;
                        imageToUpdate.license = parsedImg.license;
                        imageToUpdate.cocoImageId = parsedImg.cocoImageId;
                        updatedCount++;
                    } else {
                        // Create new image
                        const newImage = new DatasetImage();
                        newImage.img_key = parsedImg.img_key;
                        newImage.row_number = index + 1;
                        newImage.filename = parsedImg.filename;
                        newImage.url = parsedImg.url;
                        newImage.flickrUrl = parsedImg.flickrUrl;
                        newImage.width = parsedImg.width;
                        newImage.height = parsedImg.height;
                        newImage.prompt = parsedImg.prompt;
                        newImage.additionalCaptions = parsedImg.additionalCaptions.length > 0 ? parsedImg.additionalCaptions : undefined;
                        newImage.license = parsedImg.license;
                        newImage.cocoImageId = parsedImg.cocoImageId;
                        newImage.dataset = dataset;
                        newCount++;
                        imageToUpdate = newImage;
                    }

                    imagesToSave.push(imageToUpdate);
                    processedUrls.add(parsedImg.url);
                });

                // Save all images
                await imageRepository.save(imagesToSave);

                // Delete images no longer in COCO file
                const imagesToDelete = existingImages.filter(img => 
                    img.url && !processedUrls.has(img.url)
                );

                if (imagesToDelete.length > 0) {
                    await imageRepository.remove(imagesToDelete);
                    deletedCount = imagesToDelete.length;
                    logger.info(`Removed ${deletedCount} images that are no longer in COCO for dataset ${dataset.name}`);
                }

                logger.info(`Successfully uploaded COCO file ${uniqueFilename} to dataset ${dataset.name}. Updated: ${updatedCount}, New: ${newCount}, Deleted: ${deletedCount}`);
                res.status(201).json({
                    message: `Successfully uploaded ${imagesToSave.length} images to dataset ${dataset.name}`,
                    format: 'coco',
                    stats: {
                        total: imagesToSave.length,
                        updated: updatedCount,
                        new: newCount,
                        deleted: deletedCount
                    },
                    fileId: datasetFile.id,
                    filename: datasetFile.originalName
                });

            } catch (parseError: any) {
                logger.error(`COCO parsing error for dataset ${id}`, { error: parseError });
                // Delete the saved file on parse error
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                await fileRepository.remove(datasetFile);
                return res.status(400).json({
                    error: 'COCO parsing failed',
                    message: parseError.message || 'Invalid COCO format'
                });
            }

        } else {
            // === CSV FORMAT PROCESSING (ORIGINAL LOGIC) ===
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

            const readable = Readable.from(req.file.buffer);
            let rowCounter = 1;

            readable
                .pipe(csv())
                .on('data', (row) => {
                    const url = row.url;
                    const csvImgKey = row.img_key;

                    let imageToUpdate: DatasetImage | undefined;

                    // Try to find existing image
                    if (csvImgKey && existingImagesByImgKey.has(csvImgKey)) {
                        imageToUpdate = existingImagesByImgKey.get(csvImgKey);
                    } else if (url && existingImagesByUrl.has(url)) {
                        imageToUpdate = existingImagesByUrl.get(url);
                    }

                    if (imageToUpdate) {
                        // Update existing image
                        imageToUpdate.row_number = rowCounter++;
                        imageToUpdate.filename = row.filename || imageToUpdate.filename;
                        imageToUpdate.url = url || imageToUpdate.url;
                        imageToUpdate.width = row.width ? parseInt(row.width, 10) : imageToUpdate.width;
                        imageToUpdate.height = row.height ? parseInt(row.height, 10) : imageToUpdate.height;
                        imageToUpdate.prompt = row.prompt !== undefined ? row.prompt : imageToUpdate.prompt;
                        imagesToSave.push(imageToUpdate);
                        processedUrls.add(url);
                    } else {
                        // Create new image
                        const newImage = new DatasetImage();
                        newImage.img_key = csvImgKey || randomUUID();
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
                        await imageRepository.save(imagesToSave);

                        const imagesToDelete = existingImages.filter(img =>
                            img.url && !processedUrls.has(img.url)
                        );

                        if (imagesToDelete.length > 0) {
                            await imageRepository.remove(imagesToDelete);
                            logger.info(`Removed ${imagesToDelete.length} images that are no longer in CSV for dataset ${dataset.name}`);
                        }

                        const finalUpdatedCount = imagesToSave.filter(img => img.id).length;
                        const finalNewCount = imagesToSave.length - finalUpdatedCount;

                        logger.info(`Successfully uploaded CSV file ${uniqueFilename} to dataset ${dataset.name}. Updated: ${finalUpdatedCount}, New: ${finalNewCount}, Deleted: ${imagesToDelete.length}`);
                        res.status(201).json({
                            message: `Successfully uploaded ${imagesToSave.length} images to dataset ${dataset.name}`,
                            format: 'csv',
                            stats: {
                                total: imagesToSave.length,
                                updated: finalUpdatedCount,
                                new: finalNewCount,
                                deleted: imagesToDelete.length
                            },
                            fileId: datasetFile.id,
                            filename: datasetFile.originalName
                        });
                    } catch (dbError) {
                        logger.error(`DB error during CSV save for dataset ${id}`, { error: dbError });
                        res.status(500).send('Error saving images to database.');
                    }
                })
                .on('error', (csvError) => {
                    logger.error(`CSV parsing error for dataset ${id}`, { error: csvError });
                    res.status(400).json({
                        error: 'CSV parsing failed',
                        message: 'Invalid CSV format'
                    });
                });
        }

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

        // Sort files by creation date DESC (newest first)
        const sortedFiles = [...dataset.files].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Return files data without file paths for security
        const filesData = sortedFiles.map(file => ({
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
 * Edit image caption (requires edit_caption permission)
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
        message: 'New caption must be provided' 
      });
    }

    try {
      // Check if dataset exists
      const dataset = await datasetRepository.findOne({
        where: { id: datasetId },
      });

      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      // Get image
      const image = await imageRepository.findOne({
        where: { 
          id: parseInt(imageId),
          dataset: { id: datasetId },
        },
        relations: ['dataset'],
      });

      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      const oldCaption = image.prompt;

      // Check if caption has changed
      if (oldCaption === caption) {
        return res.status(400).json({ 
          message: 'New caption is identical to current caption' 
        });
      }

      // Save edit history
      const historyRepository = AppDataSource.manager.getRepository(CaptionEditHistory);
      const historyEntry = historyRepository.create({
        imageId: image.id,
        userId: userId,
        oldCaption: oldCaption,
        newCaption: caption,
      });
      await historyRepository.save(historyEntry);

      // Update caption
      image.prompt = caption;
      await imageRepository.save(image);

      logger.info('Caption edited', {
        userId,
        username: req.user?.username,
        datasetId,
        imageId,
      });

      res.json({ 
        message: 'Caption updated successfully',
        image: {
          id: image.id,
          caption: image.prompt,
        }
      });
    } catch (error) {
      logger.error('Error editing caption', { error, datasetId, imageId });
      res.status(500).json({ message: 'Error editing caption' });
    }
  }
);

/**
 * GET /api/datasets/:datasetId/images/:imageId/caption-history
 * Get image caption edit history
 */
router.get(
  '/:datasetId/images/:imageId/caption-history',
  checkJwtOptional,
  async (req: Request, res: Response) => {
    const { datasetId, imageId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    try {
      // Check if dataset exists
      const dataset = await datasetRepository.findOne({
        where: { id: datasetId },
      });

      if (!dataset) {
        return res.status(404).json({ message: 'Dataset not found' });
      }

      // Check dataset access
      const isAdmin = userRole === UserRole.ADMIN;
      const isOwner = userId && dataset.userId === userId;
      const isPublic = dataset.isPublic;

      if (!isPublic && !isOwner && !isAdmin) {
        return res.status(403).json({ 
          message: 'Access to this dataset is denied' 
        });
      }

      // Get image
      const image = await imageRepository.findOne({
        where: { 
          id: parseInt(imageId),
          dataset: { id: datasetId },
        },
      });

      if (!image) {
        return res.status(404).json({ message: 'Image not found' });
      }

      // Get edit history
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
      res.status(500).json({ message: 'Error fetching edit history' });
    }
  }
);

// POST /api/datasets/:id/likes - Like a dataset
router.post('/:id/likes', checkJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    // Check if dataset exists
    const dataset = await datasetRepository.findOne({ where: { id } });
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    const likeRepository = AppDataSource.manager.getRepository(Like);

    // Check if like already exists
    const existingLike = await likeRepository.findOne({
      where: { userId, datasetId: id }
    });

    if (existingLike) {
      return res.status(400).json({ message: 'You have already liked this dataset' });
    }

    // Create new like
    const like = likeRepository.create({
      userId,
      datasetId: id
    });

    await likeRepository.save(like);

    logger.info('Like created', { datasetId: id, userId });
    res.status(201).json({ message: 'Like added', like });
  } catch (error) {
    logger.error('Failed to create like', { error, datasetId: id, userId });
    res.status(500).json({ message: 'Error adding like' });
  }
});

// DELETE /api/datasets/:id/likes - Remove like from dataset
router.delete('/:id/likes', checkJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user!.userId;

  try {
    const likeRepository = AppDataSource.manager.getRepository(Like);

    // Find like
    const like = await likeRepository.findOne({
      where: { userId, datasetId: id }
    });

    if (!like) {
      return res.status(404).json({ message: 'Like not found' });
    }

    await likeRepository.remove(like);

    logger.info('Like removed', { datasetId: id, userId });
    res.json({ message: 'Like removed' });
  } catch (error) {
    logger.error('Failed to remove like', { error, datasetId: id, userId });
    res.status(500).json({ message: 'Error removing like' });
  }
});

// GET /api/datasets/:id/likes - Get list of likes with users
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
    res.status(500).json({ message: 'Error fetching likes' });
  }
});

// GET /api/datasets/:id/contributors - Get discussion contributors statistics
router.get('/:id/contributors', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // Check if dataset exists
    const dataset = await datasetRepository.findOne({ where: { id } });
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    const discussionRepository = AppDataSource.manager.getRepository(Discussion);
    const postRepository = AppDataSource.manager.getRepository(DiscussionPost);

    // Get all dataset discussions
    const discussions = await discussionRepository.find({
      where: { datasetId: id },
      relations: ['author']
    });

    if (discussions.length === 0) {
      return res.json([]);
    }

    const discussionIds = discussions.map(d => d.id);

    // Get all posts from these discussions
    const posts = await postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.discussionId IN (:...discussionIds)', { discussionIds })
      .andWhere('post.isDeleted = :isDeleted', { isDeleted: false })
      .getMany();

    // Collect contributor statistics
    const contributorsMap = new Map<string, {
      user: User;
      discussionsCreated: number;
      postsCount: number;
    }>();

    // Count created discussions
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

    // Count posts
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

    // Format result
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

    // Sort by activity
    contributors.sort((a, b) => b.totalActivity - a.totalActivity);

    res.json(contributors);
  } catch (error) {
    logger.error('Failed to fetch contributors', { error, datasetId: id });
    res.status(500).json({ message: 'Error fetching contributor statistics' });
  }
});


export default router;
