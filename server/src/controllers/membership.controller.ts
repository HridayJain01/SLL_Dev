import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { PLAN_CODES, getPlanAllowance, normalizePlanCode } from '../config/constants.js';

const createMembershipSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(PLAN_CODES),
  durationMonths: z.coerce.number().refine((v) => [1, 3, 6, 12].includes(v)),
  startDate: z.coerce.date(),
});

const updateMembershipSchema = z.object({
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
  plan: z.enum(PLAN_CODES).optional(),
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

    const allowance = getPlanAllowance(data.plan);

    // Delete existing membership if any
    await Membership.findOneAndDelete({ userId: data.userId });

    const membership = await Membership.create({
      userId: data.userId,
      plan: data.plan,
      durationMonths: data.durationMonths,
      startDate,
      endDate,
      booksPerCycle: allowance.booksPerCycle,
      monthlyBookLimit: allowance.monthlyBookLimit,
      monthlyPuzzleLimit: allowance.monthlyPuzzleLimit,
      monthlyTotalLimit: allowance.monthlyTotalLimit,
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
    const membership = await Membership.findById(req.params.id);
    if (!membership) return res.status(404).json({ message: 'Membership not found' });

    const nextPlan = data.plan ?? normalizePlanCode(membership.plan) ?? 'LITTLE_READER';
    const nextDuration = (data.durationMonths ?? membership.durationMonths) as 1 | 3 | 6 | 12;
    const nextStartDate = data.startDate ? new Date(data.startDate) : membership.startDate;
    const nextEndDate = data.endDate ? new Date(data.endDate) : new Date(nextStartDate);
    if (!data.endDate) {
      nextEndDate.setMonth(nextEndDate.getMonth() + nextDuration);
    }

    const allowance = getPlanAllowance(nextPlan);

    membership.plan = nextPlan;
    membership.durationMonths = nextDuration;
    membership.startDate = nextStartDate;
    membership.endDate = nextEndDate;
    membership.booksPerCycle = allowance.booksPerCycle;
    membership.monthlyBookLimit = allowance.monthlyBookLimit;
    membership.monthlyPuzzleLimit = allowance.monthlyPuzzleLimit;
    membership.monthlyTotalLimit = allowance.monthlyTotalLimit;
    if (data.status) membership.status = data.status;

    await membership.save();
    res.json({ membership });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}
