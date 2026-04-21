import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import { signToken, setCookieToken } from '../lib/jwt.js';
import { AuthRequest } from '../middleware/auth.js';

const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = signupSchema.parse(req.body);
    const existing = await User.findOne({ email: data.email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create(data);
    const token = signToken(user._id as string);
    setCookieToken(res, token);

    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;
    res.status(201).json({ user: userWithoutPassword });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    if (user.status === 'PENDING') {
      return res.status(403).json({ message: 'Account pending admin approval' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ message: 'Account suspended' });
    }

    const token = signToken(user._id as string);
    setCookieToken(res, token);

    const userObj = user.toObject();
    const { password, ...userWithoutPassword } = userObj;
    res.json({ user: userWithoutPassword });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
}

export async function getMe(req: AuthRequest, res: Response) {
  res.json({ user: req.user });
}

export async function changePassword(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(data.currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = data.newPassword;
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}
