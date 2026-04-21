import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare function getMyMembership(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function createMembership(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateMembership(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=membership.controller.d.ts.map