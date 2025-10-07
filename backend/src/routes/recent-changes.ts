import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { CaptionEditHistory } from '../entity/CaptionEditHistory.entity';
import { checkJwtOptional } from '../middleware/checkJwt';
import logger from '../logger';

const router = Router();
const captionEditHistoryRepository = AppDataSource.getRepository(CaptionEditHistory);

// GET /api/recent-changes - Get recent caption edits across all datasets
router.get('/', checkJwtOptional, async (req: Request, res: Response) => {
  const { page = '1', limit = '50' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  try {
    // Get recent edits from all users with all necessary information
    const [edits, total] = await captionEditHistoryRepository
      .createQueryBuilder('edit')
      .leftJoinAndSelect('edit.user', 'user')
      .leftJoinAndSelect('edit.image', 'image')
      .leftJoinAndSelect('image.dataset', 'dataset')
      .leftJoinAndSelect('dataset.user', 'datasetOwner')
      .orderBy('edit.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // Format response with full information
    const formattedEdits = edits.map(edit => ({
      id: edit.id,
      oldCaption: edit.oldCaption,
      newCaption: edit.newCaption,
      createdAt: edit.createdAt,
      image: {
        id: edit.image.id,
        img_key: edit.image.img_key,
        url: edit.image.url
      },
      dataset: {
        id: edit.image.dataset.id,
        name: edit.image.dataset.name,
        owner: edit.image.dataset.user ? {
          id: edit.image.dataset.user.id,
          username: edit.image.dataset.user.username
        } : null
      },
      user: edit.user ? {
        id: edit.user.id,
        username: edit.user.username
      } : null
    }));

    res.json({
      edits: formattedEdits,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    logger.error('Failed to get recent changes', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

