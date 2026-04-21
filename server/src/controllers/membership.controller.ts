import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { PLAN_QUOTA } from '../config/constants.js';

const createMembershipSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(['NORMAL', 'PREMIUM']),
  durationMonths: z.coerce.number().refine((v) => [1, 3, 6, 12].includes(v)),
  startDate: z.coerce.date(),
});

const updateMembershipSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
  plan: z.enum(['NORMAL', 'PREMIUM']).optional(),
  durationMonths: z.coerce.number().refine((v) => [1, 3, 6, 12].includes(v)).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function getMyMembership(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const membership = await Membership.findOne({ userId: req.user._id });
    res.json({ membership });
  } catch (err) {
    next(err);
  }
}

export async function createMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createMembershipSchema.parse(req.body);
    const startDate = new Date(data.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + data.durationMonths);

    const booksPerCycle = PLAN_QUOTA[data.plan];

    // Delete existing membership if any
    await Membership.findOneAndDelete({ userId: data.userId });

    const membership = await Membership.create({
      userId: data.userId,
      plan: data.plan,
      durationMonths: data.durationMonths,
      startDate,
      endDate,
      booksPerCycle,
      status: 'ACTIVE',
    });

    // Activate the user
    await User.findByIdAndUpdate(data.userId, { status: 'ACTIVE' });

    res.status(201).json({ membership });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateMembership(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateMembershipSchema.parse(req.body);
    const membership = await Membership.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!membership) return res.status(404).json({ message: 'Membership not found' });
    res.json({ membership });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}
