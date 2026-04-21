import { Request, Response, NextFunction } from 'express';
export declare function listUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function getUserById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=user.controller.d.ts.map