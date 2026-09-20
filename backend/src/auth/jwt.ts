import jwt from 'jsonwebtoken';
import { UserRole } from '../entity/User.entity';

export interface AccessTokenPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
}

const MIN_SECRET_LENGTH = 32;

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  if (process.env.NODE_ENV !== 'test' && secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return secret;
}

export function signAccessToken(payload: AccessTokenPayload, expiresIn: string | number): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload & { exp: number; iat: number } {
  const decoded = jwt.verify(token, getJwtSecret());
  if (typeof decoded === 'string' || !decoded.userId) {
    throw new Error('Invalid token payload');
  }
  return decoded as AccessTokenPayload & { exp: number; iat: number };
}
