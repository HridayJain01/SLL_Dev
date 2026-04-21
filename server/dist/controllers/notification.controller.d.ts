import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
export declare function getMyNotifications(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function markAllRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
export declare function sendReminders(_req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function sendCustomNotification(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=notification.controller.d.ts.map