import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entity/User.entity';
import { Permission } from '../entity/Permission.entity';
import { signAccessToken } from '../auth/jwt';
import { rateLimit } from '../auth/rateLimit';
import logger from '../logger';

const router = Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 8, keyPrefix: 'auth' });

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;
const MIN_PASSWORD_LENGTH = 10;

function registrationEnabled(): boolean {
  const raw = process.env.ALLOW_REGISTRATION;
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw === '1' || raw.toLowerCase() === 'true';
}

/**
 * Default permissions granted to all new users upon registration
 * These permissions allow users to participate in discussions and basic operations
 */
const DEFAULT_USER_PERMISSIONS = [
  'read_discussions',
  'create_discussions',
  'reply_to_discussions',
  'edit_own_posts',
];

// POST /api/auth/register
router.post('/register', authLimit, async (req, res) => {
  if (!registrationEnabled()) {
    return res.status(403).send('Registration is disabled');
  }

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('Username, email, and password are required');
  }
  if (!USERNAME_RE.test(String(username))) {
    return res.status(400).send('Username must be 3-32 characters: letters, numbers, _ . -');
  }
  if (!EMAIL_RE.test(String(email))) {
    return res.status(400).send('Invalid email');
  }
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return res.status(400).send(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
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

    // Grant default permissions to regular users
    if (role === UserRole.USER) {
      // Load default permissions from database
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
router.post('/login', authLimit, async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    const user = await AppDataSource.manager.findOne(User, {
      where: { email },
      select: ['id', 'email', 'role', 'password', 'username'],
    });
    if (!user) return res.status(401).send('Invalid credentials');

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).send('Invalid credentials');

    const expiresIn = rememberMe ? '30d' : '1h';
    const token = signAccessToken(
      { userId: user.id, email: user.email, role: user.role, username: user.username },
      expiresIn
    );

    res.json({ token });
  } catch (error) {
    logger.error('Error during login', { error });
    res.status(500).send('Internal Server Error');
  }
});

export default router;
