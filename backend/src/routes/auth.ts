import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source'; // Импортируем AppDataSource
import { User, UserRole } from '../entity/User.entity';
import { Permission } from '../entity/Permission.entity';
import logger from '../logger';
import { Request, Response } from 'express';

const router = Router();

/**
 * Базовые привилегии, которые выдаются всем новым пользователям при регистрации
 * Эти права позволяют пользователям участвовать в обсуждениях и базовых операциях
 */
const DEFAULT_USER_PERMISSIONS = [
  'read_discussions',
  'create_discussions',
  'reply_to_discussions',
  'edit_own_posts',
];

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('Username, email, and password are required');
  }

  try {
    const userRepository = AppDataSource.getRepository(User);
    const permissionRepository = AppDataSource.getRepository(Permission);

    // Check if user already exists
    const existingUser = await userRepository.findOne({ where: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).send('User with that username or email already exists');
    }

    // Check if this is the first user
    const userCount = await userRepository.count();
    const role = userCount === 0 ? UserRole.ADMIN : UserRole.USER;

    const user = new User();
    user.username = username;
    user.email = email;
    user.password = password;
    user.role = role;
    await user.hashPassword();

    // Для обычных пользователей выдаем базовые привилегии
    if (role === UserRole.USER) {
      // Загружаем базовые привилегии из БД
      const defaultPermissions = await permissionRepository
        .createQueryBuilder('permission')
        .where('permission.name IN (:...names)', { names: DEFAULT_USER_PERMISSIONS })
        .getMany();

      if (defaultPermissions.length > 0) {
        user.permissions = defaultPermissions;
        logger.info(`Granted ${defaultPermissions.length} default permissions to new user: ${username}`);
      } else {
        logger.warn('No default permissions found in database for new user');
      }
    }

    await userRepository.save(user);

    logger.info('User registered successfully', { 
      username, 
      role, 
      permissionsGranted: role === UserRole.USER ? DEFAULT_USER_PERMISSIONS.length : 'N/A (admin)' 
    });

    res.status(201).send('User created successfully');
  } catch (error) {
    logger.error('Error during registration', { error });
    res.status(500).send('Internal Server Error');
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    // Check if user exists and password is correct
    const user = await AppDataSource.manager.findOne(User, { where: { email: req.body.email }, select: ['id', 'email', 'role', 'password', 'username'] });
    if (!user) return res.status(401).send('Invalid credentials');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).send('Invalid credentials');

    // Sign JWT with different expiration time based on rememberMe
    // If rememberMe is true, token lasts 30 days, otherwise 1 hour
    const expiresIn = rememberMe ? '30d' : '1h';
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn }
    );

    res.json({ token });
  } catch (error) {
    logger.error('Error during login', { error });
    res.status(500).send('Internal Server Error');
  }
});

export default router;
