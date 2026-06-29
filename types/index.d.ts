import { User } from '../src/database/models/user';

declare namespace Express {
    interface Request {
        // Populated by AuthMiddleware after JWT verification
        user: User;
    }
}