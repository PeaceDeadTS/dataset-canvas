import { Router } from 'express';
import { getRepository } from 'typeorm';
import { User, UserRole } from '../entity/User.entity';
import jwt from 'jsonwebtoken';
import { getManager } from 'typeorm';
import logger from '../logger';

const router = Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).send('Username, email, and password are required');
  }

  const userRepository = getRepository(User);

  try {
    const existingUser = await userRepository.findOne({ where: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).send('User with this username or email already exists');
    }

    const userCount = await userRepository.count();

    const user = new User();
    user.username = username;
    user.email = email;
    user.password = password;
    if (userCount === 0) {
      user.role = UserRole.ADMIN;
    }
    user.hashPassword();

    await userRepository.save(user);

    res.status(201).send('User created successfully');
  } catch (error) {
    res.status(500).send('Error creating user');
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).send('Email and password are required');
  }

  const userRepository = getRepository(User);
  try {
    const user = await userRepository.findOne({ where: { email } });
    if (!user || !user.checkIfPasswordIsValid(password)) {
      return res.status(401).send('Invalid credentials');
    }

    const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

export default router;
