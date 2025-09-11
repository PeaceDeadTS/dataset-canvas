import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Dataset } from '../entity/Dataset.entity';
import { checkJwtOptional } from '../middleware/checkJwt';
import logger from '../logger';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const datasetRepository = AppDataSource.getRepository(Dataset);

// GET /api/users - Get all users with sorting options
router.get('/', checkJwtOptional, async (req: Request, res: Response) => {
  const { sortBy = 'username', order = 'ASC', role } = req.query;
  const currentUserId = req.user?.userId;

  try {
    const validSortFields = ['username', 'createdAt', 'publicDatasetCount'];
    const validOrder = ['ASC', 'DESC'];
    
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'username';
    const sortOrder = validOrder.includes((order as string)?.toUpperCase()) ? (order as string).toUpperCase() as 'ASC' | 'DESC' : 'ASC';

    let query = userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.email', 'user.role', 'user.createdAt'])
      .loadRelationCountAndMap('user.publicDatasetCount', 'user.datasets', 'dataset', qb => 
        qb.where('dataset.isPublic = :isPublic', { isPublic: true })
      );

    // Apply role filter if specified
    if (role && ['USER', 'DEVELOPER', 'ADMIN'].includes(role as string)) {
      // Преобразуем URL параметр в значение enum
      const roleMapping: { [key: string]: UserRole } = {
        'ADMIN': UserRole.ADMIN,
        'DEVELOPER': UserRole.DEVELOPER,
        'USER': UserRole.USER
      };
      const mappedRole = roleMapping[role as string];
      
      if (mappedRole) {
        query = query.where('user.role = :role', { role: mappedRole });
      }
    }

    // Apply sorting
    if (sortField === 'publicDatasetCount') {
      query = query
        .leftJoin('user.datasets', 'dataset')
        .addSelect('COUNT(CASE WHEN dataset.isPublic = true THEN 1 END)', 'publicCount')
        .groupBy('user.id')
        .orderBy('publicCount', sortOrder);
    } else if (sortField === 'createdAt') {
      query = query.orderBy('user.createdAt', sortOrder);
    } else {
      query = query.orderBy('user.username', sortOrder);
    }

    const users = await query.getMany();

    // Remove sensitive information for non-admin users
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      publicDatasetCount: (user as any).publicDatasetCount || 0,
      // Only include email if it's the current user or if they're an admin
      ...(currentUserId === user.id || req.user?.role === UserRole.ADMIN ? { email: user.email } : {})
    }));

    res.json(sanitizedUsers);
  } catch (error) {
    logger.error('Failed to get users list', { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

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
