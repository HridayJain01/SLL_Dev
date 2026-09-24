import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Plan from '../models/Plan.js';
import Membership from '../models/Membership.js';
import { PLAN_CODES, PlanAllowance, PlanCode, getPlanAllowance } from '../config/constants.js';

const limit = z.number().int().min(0).max(100).nullable();
const priceRow = z.object({ price: z.number().int().min(0), savings: z.number().int().min(0) });
const line = z.string().trim().min(1).max(100);

const planSchema = z
  .object({
    subtitle: z.string().trim().max(120),
    badge: z.string().trim().max(40).default(''),
    features: z.array(line).max(20),
    excludedFeatures: z.array(line).max(20).default([]),
    pricing: z.object({ '1': priceRow, '3': priceRow, '6': priceRow, '12': priceRow }),
    monthlyBookLimit: limit,
    monthlyPuzzleLimit: limit,
    monthlyTotalLimit: limit,
  })
  // Quota checks skip a blank limit, so an uncapped plan would let a member
  // order the whole shelf. The box screen reads a blank puzzle cap as zero, so
  // split plans must state both.
  .refine((p) => p.monthlyTotalLimit !== null || (p.monthlyBookLimit !== null && p.monthlyPuzzleLimit !== null), {
    message: 'Set a total item limit, or both a book and a puzzle limit',
    path: ['monthlyTotalLimit'],
  });

type Limits = Pick<PlanAllowance, 'monthlyBookLimit' | 'monthlyPuzzleLimit' | 'monthlyTotalLimit'>;

export function allowanceFrom(limits: Limits): PlanAllowance {
  return {
    monthlyBookLimit: limits.monthlyBookLimit,
    monthlyPuzzleLimit: limits.monthlyPuzzleLimit,
    monthlyTotalLimit: limits.monthlyTotalLimit,
    booksPerCycle: limits.monthlyTotalLimit ?? (limits.monthlyBookLimit ?? 0) + (limits.monthlyPuzzleLimit ?? 0),
  };
}

/** The allowance a plan is sold with right now: the admin's edit if there is one. */
export async function resolvePlanAllowance(plan: PlanCode): Promise<PlanAllowance> {
  const saved = await Plan.findOne({ code: plan }).lean();
  return saved ? allowanceFrom(saved) : getPlanAllowance(plan);
}

export async function listPlans(_req: Request, res: Response, next: NextFunction) {
  try {
    const plans = await Plan.find().select('-_id -__v -createdAt').lean();
    res.json({ plans });
  } catch (err) {
    next(err);
  }
}

export async function updatePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params.code as PlanCode;
    if (!PLAN_CODES.includes(code)) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    const data = planSchema.parse(req.body);

    const plan = await Plan.findOneAndUpdate(
      { code },
      { ...data, code },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    // Members already on this plan get the new allowance straight away — the
    // quota check reads it off their membership, not off the plan.
    const { modifiedCount } = await Membership.updateMany({ plan: code }, { $set: allowanceFrom(data) });

    res.json({ plan, membersUpdated: modifiedCount });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: err.errors[0]?.message ?? 'Validation error', errors: err.errors });
    }
    next(err);
  }
}
