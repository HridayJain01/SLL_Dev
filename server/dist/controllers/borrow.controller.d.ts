import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare function listBorrows(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function assignBook(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markReturned(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function listOverdue(_req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=borrow.controller.d.ts.map