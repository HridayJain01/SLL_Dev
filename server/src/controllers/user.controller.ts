import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import Borrow from '../models/Borrow.js';
import { AuthRequest } from '../middleware/auth.js';
import { PLAN_QUOTA } from '../config/constants.js';

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, role, search } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const membership = await Membership.findOne({ userId: user._id });
    const borrows = await Borrow.find({ userId: user._id })
      .populate('bookId', 'title coverImage')
      .sort({ createdAt: -1 });

    res.json({ user, membership, borrows });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = z.object({ status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']) }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = z.object({ role: z.enum(['USER', 'ADMIN']) }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}
