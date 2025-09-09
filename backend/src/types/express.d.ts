import { UserRole } from '../entity/User.entity';

declare global {
  namespace Express {
    export interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}
