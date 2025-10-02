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
    const { userId, username, email, role, exp, iat } = jwtPayload;
    req.user = { userId, username, email, role };

    // Обновляем токен с сохранением оригинального времени истечения
    // Вычисляем оставшееся время до истечения токена
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = exp - currentTime;
    
    // Пересоздаем токен с тем же временем истечения (в секундах)
    const newToken = jwt.sign(
      { userId, username, email, role }, 
      process.env.JWT_SECRET || 'your_jwt_secret', 
      { expiresIn: remainingTime }
    );
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
        return next();
    }

    let jwtPayload;
    try {
        jwtPayload = <any>jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        res.locals.jwtPayload = jwtPayload;

        // ВАЖНО: Устанавливаем req.user для авторизованных пользователей
        const { userId, username, email, role, exp } = jwtPayload;
        req.user = { userId, username, email, role };

        // Обновляем токен с сохранением оригинального времени истечения
        const currentTime = Math.floor(Date.now() / 1000);
        const remainingTime = exp - currentTime;
        
        const newToken = jwt.sign(
            { userId, username, email, role }, 
            process.env.JWT_SECRET || 'your_jwt_secret', 
            { expiresIn: remainingTime }
        );
        res.setHeader('token', newToken);
    } catch (error: any) {
        // If token is invalid, just proceed without user info
    }

    next();
};
