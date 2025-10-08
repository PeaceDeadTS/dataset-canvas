import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Permission, PermissionType } from '../entity/Permission.entity';
import { checkJwt } from '../middleware/checkJwt';
import { getUserPermissions } from '../middleware/checkPermission';
import logger from '../logger';

const router = Router();

// Middleware to check administrator rights
const checkAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ 
      message: 'Access denied. Administrator rights required.' 
    });
  }
  next();
};

/**
 * GET /api/permissions
 * Get list of all available permissions in the system
 */
router.get('/', checkJwt, async (req: Request, res: Response) => {
  try {
    const permissionRepository = AppDataSource.manager.getRepository(Permission);
    const permissions = await permissionRepository.find({
      order: { displayName: 'ASC' },
    });

    res.json(permissions);
  } catch (error) {
    logger.error('Error fetching permissions', { error });
    res.status(500).json({ message: 'Error fetching permissions list' });
  }
});

/**
 * GET /api/permissions/user/:userId
 * Get all permissions for a specific user
 */
router.get('/user/:userId', checkJwt, async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Only administrators or the user themselves can view permissions
    if (req.user?.role !== UserRole.ADMIN && req.user?.userId !== userId) {
      return res.status(403).json({ 
        message: 'Access denied' 
      });
    }

    const userPermissions = await getUserPermissions(userId);
    
    res.json({ 
      userId, 
      permissions: userPermissions 
    });
  } catch (error) {
    logger.error('Error fetching user permissions', { error, userId });
    res.status(500).json({ message: 'Error fetching user permissions' });
  }
});

/**
 * POST /api/permissions/grant
 * Grant permission to user (administrators only)
 * Body: { userId: string, permissionName: string }
 */
router.post('/grant', checkJwt, checkAdmin, async (req: Request, res: Response) => {
  const { userId, permissionName } = req.body;

  if (!userId || !permissionName) {
    return res.status(400).json({ 
      message: 'userId and permissionName must be provided' 
    });
  }

  try {
    const userRepository = AppDataSource.manager.getRepository(User);
    const permissionRepository = AppDataSource.manager.getRepository(Permission);

    // Get user with their permissions
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get permission
    const permission = await permissionRepository.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Check if permission is already granted
    const hasPermission = user.permissions.some(p => p.id === permission.id);
    if (hasPermission) {
      return res.status(400).json({ 
        message: 'User already has this permission' 
      });
    }

    // Add permission
    user.permissions.push(permission);
    await userRepository.save(user);

    logger.info('Permission granted', {
      admin: req.user?.username,
      targetUser: user.username,
      permission: permissionName,
    });

    res.json({ 
      message: 'Permission granted successfully',
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions.map(p => p.name),
      }
    });
  } catch (error) {
    logger.error('Error granting permission', { error, userId, permissionName });
    res.status(500).json({ message: 'Error granting permission' });
  }
});

/**
 * POST /api/permissions/revoke
 * Revoke permission from user (administrators only)
 * Body: { userId: string, permissionName: string }
 */
router.post('/revoke', checkJwt, checkAdmin, async (req: Request, res: Response) => {
  const { userId, permissionName } = req.body;

  if (!userId || !permissionName) {
    return res.status(400).json({ 
      message: 'userId and permissionName must be provided' 
    });
  }

  try {
    const userRepository = AppDataSource.manager.getRepository(User);
    const permissionRepository = AppDataSource.manager.getRepository(Permission);

    // Get user with their permissions
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get permission
    const permission = await permissionRepository.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Check if user has this permission
    const permissionIndex = user.permissions.findIndex(p => p.id === permission.id);
    if (permissionIndex === -1) {
      return res.status(400).json({ 
        message: 'User does not have this permission' 
      });
    }

    // Remove permission
    user.permissions.splice(permissionIndex, 1);
    await userRepository.save(user);

    logger.info('Permission revoked', {
      admin: req.user?.username,
      targetUser: user.username,
      permission: permissionName,
    });

    res.json({ 
      message: 'Permission revoked successfully',
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions.map(p => p.name),
      }
    });
  } catch (error) {
    logger.error('Error revoking permission', { error, userId, permissionName });
    res.status(500).json({ message: 'Error revoking permission' });
  }
});

/**
 * GET /api/permissions/users-with-permission/:permissionName
 * Get list of users with specific permission (administrators only)
 */
router.get('/users-with-permission/:permissionName', checkJwt, checkAdmin, async (req: Request, res: Response) => {
  const { permissionName } = req.params;

  try {
    const permissionRepository = AppDataSource.manager.getRepository(Permission);
    
    const permission = await permissionRepository.findOne({
      where: { name: permissionName as PermissionType },
      relations: ['users'],
    });

    if (!permission) {
      return res.status(404).json({ message: 'Permission not found' });
    }

    // Add all administrators (they have all permissions)
    const userRepository = AppDataSource.manager.getRepository(User);
    const admins = await userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    // Merge lists (excluding duplicates)
    const allUsersWithPermission = [
      ...permission.users,
      ...admins.filter(admin => 
        !permission.users.some(user => user.id === admin.id)
      ),
    ];

    const users = allUsersWithPermission.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    }));

    res.json({ 
      permission: {
        name: permission.name,
        displayName: permission.displayName,
        description: permission.description,
      },
      users 
    });
  } catch (error) {
    logger.error('Error fetching users with permission', { error, permissionName });
    res.status(500).json({ message: 'Error fetching users list' });
  }
});

export default router;

