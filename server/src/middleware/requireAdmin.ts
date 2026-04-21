import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.js';

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
  next();
}
