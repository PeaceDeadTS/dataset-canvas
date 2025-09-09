import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  const token = <string>req.headers['authorization']?.split(' ')[1];
  let jwtPayload;

  try {
    jwtPayload = <any>jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    res.locals.jwtPayload = jwtPayload;
  } catch (error) {
    res.status(401).send('Unauthorized');
    return;
  }

  const { userId, username, role } = jwtPayload;
  const newToken = jwt.sign({ userId, username, role }, process.env.JWT_SECRET || 'your_jwt_secret', {
    expiresIn: '1h',
  });
  res.setHeader('token', newToken);

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

        const { userId, username, role } = jwtPayload;
        const newToken = jwt.sign({ userId, username, role }, process.env.JWT_SECRET || 'your_jwt_secret', {
            expiresIn: '1h',
        });
        res.setHeader('token', newToken);
    } catch (error) {
        // If token is invalid, just proceed without user info
    }

    next();
};
