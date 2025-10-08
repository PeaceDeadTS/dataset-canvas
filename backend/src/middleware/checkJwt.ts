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
    
    // Critical fix: add data to req.user
    const { userId, username, email, role, exp, iat } = jwtPayload;
    req.user = { userId, username, email, role };

    // Refresh token while preserving original expiration time
    // Calculate remaining time until token expiration
    const currentTime = Math.floor(Date.now() / 1000);
    const remainingTime = exp - currentTime;
    
    // Recreate token with the same expiration time (in seconds)
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

        // IMPORTANT: Set req.user for authenticated users
        const { userId, username, email, role, exp } = jwtPayload;
        req.user = { userId, username, email, role };

        // Refresh token while preserving original expiration time
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
