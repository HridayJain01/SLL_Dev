import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { blockedReason, type IUser } from '../models/User.js';

export interface AuthRequest extends Request {
  /** Set by `protect`. Undefined on any route that does not run it, hence the `!` in handlers behind it. */
  user?: IUser;
}

export async function protect(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });

    // Re-checked per request, not just at login: a token minted before the
    // account was suspended stays cryptographically valid for its full 7 days.
    // 401 rather than 403 so the client's axios interceptor clears the session.
    const blocked = blockedReason(req.user.status);
    if (blocked) return res.status(401).json({ message: blocked });

    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
