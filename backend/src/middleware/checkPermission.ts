import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Permission, PermissionType } from '../entity/Permission.entity';
import logger from '../logger';

/**
 * Middleware для проверки наличия конкретного права у пользователя
 * Администраторы имеют все права по умолчанию
 * 
 * @param permissionName - Название права для проверки (например, 'edit_caption')
 */
export const checkPermission = (permissionName: PermissionType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Проверяем, что пользователь авторизован
    if (!req.user || !req.user.userId) {
      logger.warn('Permission check failed: User not authenticated');
      return res.status(401).json({ 
        message: 'Требуется авторизация' 
      });
    }

    const userId = req.user.userId;

    try {
      // Получаем пользователя с правами
      const userRepository = AppDataSource.manager.getRepository(User);
      const user = await userRepository.findOne({
        where: { id: userId },
        relations: ['permissions'],
      });

      if (!user) {
        logger.warn(`Permission check failed: User not found (${userId})`);
        return res.status(401).json({ 
          message: 'Пользователь не найден' 
        });
      }

      // Администраторы имеют все права
      if (user.role === UserRole.ADMIN) {
        logger.info(`Permission granted (admin): ${user.username} - ${permissionName}`);
        return next();
      }

      // Проверяем наличие конкретного права
      const hasPermission = user.permissions.some(
        (permission) => permission.name === permissionName
      );

      if (!hasPermission) {
        logger.warn(`Permission denied: ${user.username} - ${permissionName}`);
        return res.status(403).json({ 
          message: `Недостаточно прав для выполнения этого действия. Требуется право: ${permissionName}` 
        });
      }

      logger.info(`Permission granted: ${user.username} - ${permissionName}`);
      next();
    } catch (error) {
      logger.error('Error checking permission', { error, userId, permissionName });
      return res.status(500).json({ 
        message: 'Ошибка при проверке прав доступа' 
      });
    }
  };
};

/**
 * Утилита для проверки прав в коде (не middleware)
 * Возвращает boolean - имеет ли пользователь указанное право
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

    // Администраторы имеют все права
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Проверяем наличие конкретного права
    return user.permissions.some(
      (permission) => permission.name === permissionName
    );
  } catch (error) {
    logger.error('Error checking user permission', { error, userId, permissionName });
    return false;
  }
};

/**
 * Получить все права пользователя
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

    // Администраторы имеют все права
    if (user.role === UserRole.ADMIN) {
      return Object.values(PermissionType);
    }

    return user.permissions.map(p => p.name);
  } catch (error) {
    logger.error('Error getting user permissions', { error, userId });
    return [];
  }
};

