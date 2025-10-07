import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Permission, PermissionType } from '../entity/Permission.entity';
import { checkJwt } from '../middleware/checkJwt';
import { getUserPermissions } from '../middleware/checkPermission';
import logger from '../logger';

const router = Router();

// Middleware для проверки прав администратора
const checkAdmin = (req: Request, res: Response, next: Function) => {
  if (!req.user || req.user.role !== UserRole.ADMIN) {
    return res.status(403).json({ 
      message: 'Доступ запрещен. Требуются права администратора.' 
    });
  }
  next();
};

/**
 * GET /api/permissions
 * Получить список всех доступных прав в системе
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
    res.status(500).json({ message: 'Ошибка при получении списка прав' });
  }
});

/**
 * GET /api/permissions/user/:userId
 * Получить все права конкретного пользователя
 */
router.get('/user/:userId', checkJwt, async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    // Только администраторы или сам пользователь могут смотреть права
    if (req.user?.role !== UserRole.ADMIN && req.user?.userId !== userId) {
      return res.status(403).json({ 
        message: 'Доступ запрещен' 
      });
    }

    const userPermissions = await getUserPermissions(userId);
    
    res.json({ 
      userId, 
      permissions: userPermissions 
    });
  } catch (error) {
    logger.error('Error fetching user permissions', { error, userId });
    res.status(500).json({ message: 'Ошибка при получении прав пользователя' });
  }
});

/**
 * POST /api/permissions/grant
 * Выдать право пользователю (только для администраторов)
 * Body: { userId: string, permissionName: string }
 */
router.post('/grant', checkJwt, checkAdmin, async (req: Request, res: Response) => {
  const { userId, permissionName } = req.body;

  if (!userId || !permissionName) {
    return res.status(400).json({ 
      message: 'Необходимо указать userId и permissionName' 
    });
  }

  try {
    const userRepository = AppDataSource.manager.getRepository(User);
    const permissionRepository = AppDataSource.manager.getRepository(Permission);

    // Получаем пользователя с его правами
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Получаем право
    const permission = await permissionRepository.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      return res.status(404).json({ message: 'Право не найдено' });
    }

    // Проверяем, не выдано ли уже это право
    const hasPermission = user.permissions.some(p => p.id === permission.id);
    if (hasPermission) {
      return res.status(400).json({ 
        message: 'У пользователя уже есть это право' 
      });
    }

    // Добавляем право
    user.permissions.push(permission);
    await userRepository.save(user);

    logger.info('Permission granted', {
      admin: req.user?.username,
      targetUser: user.username,
      permission: permissionName,
    });

    res.json({ 
      message: 'Право успешно выдано',
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions.map(p => p.name),
      }
    });
  } catch (error) {
    logger.error('Error granting permission', { error, userId, permissionName });
    res.status(500).json({ message: 'Ошибка при выдаче права' });
  }
});

/**
 * POST /api/permissions/revoke
 * Отозвать право у пользователя (только для администраторов)
 * Body: { userId: string, permissionName: string }
 */
router.post('/revoke', checkJwt, checkAdmin, async (req: Request, res: Response) => {
  const { userId, permissionName } = req.body;

  if (!userId || !permissionName) {
    return res.status(400).json({ 
      message: 'Необходимо указать userId и permissionName' 
    });
  }

  try {
    const userRepository = AppDataSource.manager.getRepository(User);
    const permissionRepository = AppDataSource.manager.getRepository(Permission);

    // Получаем пользователя с его правами
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['permissions'],
    });

    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    // Получаем право
    const permission = await permissionRepository.findOne({
      where: { name: permissionName },
    });

    if (!permission) {
      return res.status(404).json({ message: 'Право не найдено' });
    }

    // Проверяем, есть ли это право у пользователя
    const permissionIndex = user.permissions.findIndex(p => p.id === permission.id);
    if (permissionIndex === -1) {
      return res.status(400).json({ 
        message: 'У пользователя нет этого права' 
      });
    }

    // Удаляем право
    user.permissions.splice(permissionIndex, 1);
    await userRepository.save(user);

    logger.info('Permission revoked', {
      admin: req.user?.username,
      targetUser: user.username,
      permission: permissionName,
    });

    res.json({ 
      message: 'Право успешно отозвано',
      user: {
        id: user.id,
        username: user.username,
        permissions: user.permissions.map(p => p.name),
      }
    });
  } catch (error) {
    logger.error('Error revoking permission', { error, userId, permissionName });
    res.status(500).json({ message: 'Ошибка при отзыве права' });
  }
});

/**
 * GET /api/permissions/users-with-permission/:permissionName
 * Получить список пользователей с конкретным правом (только для администраторов)
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
      return res.status(404).json({ message: 'Право не найдено' });
    }

    // Добавляем всех администраторов (у них все права)
    const userRepository = AppDataSource.manager.getRepository(User);
    const admins = await userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    // Объединяем списки (исключая дубликаты)
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
    res.status(500).json({ message: 'Ошибка при получении списка пользователей' });
  }
});

export default router;

