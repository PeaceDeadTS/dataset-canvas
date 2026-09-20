import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../data-source';
import { User } from '../entity/User.entity';
import { signAccessToken, verifyAccessToken } from '../auth/jwt';
import logger from '../logger';

async function attachUserFromToken(req: Request, res: Response, token: string): Promise<boolean> {
  const jwtPayload = verifyAccessToken(token);

  const user = await AppDataSource.getRepository(User).findOne({
    where: { id: jwtPayload.userId },
    select: ['id', 'username', 'email', 'role'],
  });

  if (!user) {
    return false;
  }

  req.user = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  const remainingTime = jwtPayload.exp - Math.floor(Date.now() / 1000);
  if (remainingTime > 60) {
    const newToken = signAccessToken(
      { userId: user.id, username: user.username, email: user.email, role: user.role },
      remainingTime
    );
    res.setHeader('token', newToken);
  }

  return true;
}

export const checkJwt = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.status(401).send('Unauthorized: No token provided');
  }

  try {
    const ok = await attachUserFromToken(req, res, token);
    if (!ok) {
      return res.status(401).send('Unauthorized: Invalid token');
    }
    next();
  } catch (error) {
    logger.error('JWT Error', { error });
    return res.status(401).send('Unauthorized: Invalid token');
  }
};

export const checkJwtOptional = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    await attachUserFromToken(req, res, token);
  } catch {
    // Invalid token: treat as anonymous
  }

  next();
};
