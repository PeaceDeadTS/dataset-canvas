import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Dataset } from '../entity/Dataset.entity';
import { checkJwtOptional } from '../middleware/checkJwt';
import logger from '../logger';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const datasetRepository = AppDataSource.getRepository(Dataset);

// GET /api/users/:username - Get user profile and their datasets
router.get('/:username', checkJwtOptional, async (req: Request, res: Response) => {
  const { username } = req.params;
  const currentUserId = req.user?.userId;
  const currentUserRole = req.user?.role;

  try {
    // Find user by username
    const user = await userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'role', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user's datasets with proper access control
    const query = datasetRepository
      .createQueryBuilder('dataset')
      .leftJoinAndSelect('dataset.user', 'user')
      .loadRelationCountAndMap('dataset.imageCount', 'dataset.images')
      .where('dataset.userId = :userId', { userId: user.id });

    // Apply visibility filters based on current user
    if (currentUserRole === UserRole.ADMIN) {
      // Admin sees all datasets of the user
    } else if (currentUserId === user.id) {
      // User sees their own public and private datasets  
    } else {
      // Other users (including anonymous) see only public datasets
      query.andWhere('dataset.isPublic = :isPublic', { isPublic: true });
    }

    const datasets = await query.getMany();

    // Remove sensitive information from user object for public display
    const publicUserInfo = {
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      // Only show email to the user themselves or admin
      ...(currentUserId === user.id || currentUserRole === UserRole.ADMIN ? { email: user.email } : {})
    };

    res.json({
      user: publicUserInfo,
      datasets
    });

  } catch (error) {
    logger.error(`Failed to get user profile ${username}`, { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
