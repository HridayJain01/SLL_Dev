import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=requireAdmin.d.ts.map