import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source'; // Импортируем AppDataSource
import { User, UserRole } from '../entity/User.entity';
import logger from '../logger';
import { Request, Response } from 'express';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send('Username, email, and password are required');
  }

  try {
    const userRepository = AppDataSource.getRepository(User); // Используем AppDataSource

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

    await userRepository.save(user);

    res.status(201).send('User created successfully');
  } catch (error) {
    logger.error('Error during registration', { error });
    res.status(500).send('Internal Server Error');
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  try {
    // Check if user exists and password is correct
    const user = await AppDataSource.manager.findOne(User, { where: { email: req.body.email }, select: ['id', 'email', 'role', 'password', 'username'] });
    if (!user) return res.status(401).send('Invalid credentials');

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(401).send('Invalid credentials');

    // Sign JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    logger.error('Error during login', { error });
    res.status(500).send('Internal Server Error');
  }
});

export default router;
