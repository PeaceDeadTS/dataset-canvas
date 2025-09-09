import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../logger';

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('No token provided');
    return res.status(401).send('Unauthorized: No token provided');
  }

  let jwtPayload;
  try {
    jwtPayload = <any>jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    
    // Важнейшее исправление: добавляем данные в req.user
    const { userId, username, email, role } = jwtPayload;
    req.user = { userId, username, email, role };

    // Обновляем токен
    const newToken = jwt.sign({ userId, username, email, role }, process.env.JWT_SECRET || 'your_jwt_secret', {
      expiresIn: '1h',
    });
    res.setHeader('token', newToken);

  } catch (error) {
    logger.error('JWT Error', { error });
    return res.status(401).send('Unauthorized: Invalid token');
  }

  next();
};

export const checkJwtOptional = (req: Request, res: Response, next: NextFunction) => {
    const token = <string>req.headers['authorization']?.split(' ')[1];
    if (!token) {
        logger.info('🔍 checkJwtOptional: Нет токена, продолжаем как анонимный пользователь');
        return next();
    }

    let jwtPayload;
    try {
        jwtPayload = <any>jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        res.locals.jwtPayload = jwtPayload;

        // ВАЖНО: Устанавливаем req.user для авторизованных пользователей
        const { userId, username, email, role } = jwtPayload;
        req.user = { userId, username, email, role };
        
        logger.info('🔍 checkJwtOptional: Пользователь авторизован', { 
            userId, 
            username, 
            role 
        });

        const newToken = jwt.sign({ userId, username, email, role }, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '1h',
        });
        res.setHeader('token', newToken);
    } catch (error) {
        logger.warn('🔍 checkJwtOptional: Недействительный токен, продолжаем как анонимный', { error: error.message });
        // If token is invalid, just proceed without user info
    }

    next();
};
