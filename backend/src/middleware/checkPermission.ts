import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Permission, PermissionType } from '../entity/Permission.entity';
import logger from '../logger';

/**
 * Middleware to check if a user has a specific permission
 * Administrators have all permissions by default
 * 
 * @param permissionName - Name of the permission to check (e.g., 'edit_caption')
 */
export const checkPermission = (permissionName: PermissionType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      logger.warn('Permission check failed: User not authenticated');
      return res.status(401).json({ 
        message: 'Authentication required' 
      });
    }

    const userId = req.user.userId;

    try {
      // Get user with permissions
      const userRepository = AppDataSource.manager.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['permissions'],
      });

      if (!user) {
        logger.warn(`Permission check failed: User not found (${userId})`);
        return res.status(401).json({ 
          message: 'User not found' 
        });
      }

      // Administrators have all permissions
      if (user.role === UserRole.ADMIN) {
        logger.info(`Permission granted (admin): ${user.username} - ${permissionName}`);
        return next();
      }

      // Check if user has the specific permission
      const hasPermission = user.permissions.some(
        (permission) => permission.name === permissionName
      );

      if (!hasPermission) {
        logger.warn(`Permission denied: ${user.username} - ${permissionName}`);
        return res.status(403).json({ 
          message: `Insufficient permissions to perform this action. Required permission: ${permissionName}` 
        });
      }

      logger.info(`Permission granted: ${user.username} - ${permissionName}`);
      next();
    } catch (error) {
      logger.error('Error checking permission', { error, userId, permissionName });
      return res.status(500).json({ 
        message: 'Error checking permissions' 
      });
    }
  };
};

/**
 * Utility function to check permissions in code (not middleware)
 * Returns boolean indicating whether the user has the specified permission
 */
export const userHasPermission = async (
  userId: string, 
  permissionName: PermissionType
): Promise<boolean> => {
  try {
    const userRepository = AppDataSource.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });

    if (!user) {
      return false;
    }

    // Administrators have all permissions
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Check if user has the specific permission
    return user.permissions.some(
      (permission) => permission.name === permissionName
    );
  } catch (error) {
    logger.error('Error checking user permission', { error, userId, permissionName });
    return false;
  }
};

/**
 * Get all user permissions
 */
export const getUserPermissions = async (userId: string): Promise<PermissionType[]> => {
  try {
    const userRepository = AppDataSource.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });

    if (!user) {
      return [];
    }

    // Administrators have all permissions
    if (user.role === UserRole.ADMIN) {
      return Object.values(PermissionType);
    }

    return user.permissions.map(p => p.name);
  } catch (error) {
    logger.error('Error getting user permissions', { error, userId });
    return [];
  }
};

