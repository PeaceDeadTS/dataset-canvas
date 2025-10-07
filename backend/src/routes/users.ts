import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Dataset } from '../entity/Dataset.entity';
import { CaptionEditHistory } from '../entity/CaptionEditHistory.entity';
import { checkJwtOptional, checkJwt } from '../middleware/checkJwt';
import logger from '../logger';

const router = Router();
const userRepository = AppDataSource.getRepository(User);
const datasetRepository = AppDataSource.getRepository(Dataset);
const captionEditHistoryRepository = AppDataSource.getRepository(CaptionEditHistory);

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
      id: user.id,
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

// GET /api/users/:id/edits - Get user's caption edits with pagination
router.get('/:id/edits', checkJwtOptional, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page = '1', limit = '20' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  try {
    // Get user edits with all necessary information
    const [edits, total] = await captionEditHistoryRepository
      .createQueryBuilder('edit')
      .leftJoinAndSelect('edit.user', 'user')
      .leftJoinAndSelect('edit.image', 'image')
      .leftJoinAndSelect('image.dataset', 'dataset')
      .where('edit.userId = :userId', { userId: id })
      .orderBy('edit.createdAt', 'DESC')
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    // Format response
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
        name: edit.image.dataset.name
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
    logger.error(`Failed to get user edits for user ${id}`, { error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PUT /api/users/:id/role - Update user role (Admin only)
router.put('/:id/role', checkJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;
  const currentUserRole = req.user?.role;
  const currentUserId = req.user?.userId;

  // Only administrators can change user roles
  if (currentUserRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Access denied. Admin rights required.' });
  }

  // Validate role
  if (!role || !Object.values(UserRole).includes(role as UserRole)) {
    return res.status(400).json({ error: 'Invalid role. Must be one of: Administrator, Developer, User' });
  }

  try {
    const user = await userRepository.findOneBy({ id });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from changing their own role to avoid lockout
    if (currentUserId === id && role !== UserRole.ADMIN) {
      return res.status(400).json({ error: 'Cannot change your own admin role' });
    }

    const oldRole = user.role;
    user.role = role as UserRole;
    await userRepository.save(user);

    logger.info(`User role updated`, { 
      userId: id, 
      username: user.username,
      oldRole, 
      newRole: role, 
      adminId: currentUserId 
    });

    res.json({ 
      message: `User ${user.username} role updated to ${role}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    logger.error('Failed to update user role', { userId: id, error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/:id', checkJwt, async (req: Request, res: Response) => {
  const { id } = req.params;
  const currentUserRole = req.user?.role;
  const currentUserId = req.user?.userId;

  // Only administrators can delete users
  if (currentUserRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: 'Access denied. Admin rights required.' });
  }

  // Prevent admin from deleting themselves
  if (currentUserId === id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  try {
    const user = await userRepository.findOne({
      where: { id },
      relations: ['datasets']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get count of user's datasets for logging
    const datasetCount = user.datasets?.length || 0;
    const username = user.username;

    // Delete the user (cascading delete will handle datasets and images)
    await userRepository.remove(user);

    logger.info(`User deleted by admin`, { 
      deletedUserId: id, 
      deletedUsername: username,
      datasetCount,
      adminId: currentUserId 
    });

    res.json({ 
      message: `User ${username} and ${datasetCount} associated datasets have been deleted successfully` 
    });

  } catch (error) {
    logger.error('Failed to delete user', { userId: id, error });
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
