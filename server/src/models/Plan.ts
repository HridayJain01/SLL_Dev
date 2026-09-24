import mongoose, { Schema, Document } from 'mongoose';
import { PLAN_CODES, PlanCode } from '../config/constants.js';

/**
 * An admin's edit of one plan. A plan with no row here is sold exactly as
 * `PLAN_DEFINITIONS` (server) and `client/src/lib/plans.ts` describe it.
 */
export interface IPlan extends Document {
  code: PlanCode;
  subtitle: string;
  badge: string;
  features: string[];
  excludedFeatures: string[];
  /** Keyed by duration in months: { '1': { price, savings }, '3': …, '6': …, '12': … } */
  pricing: Record<string, { price: number; savings: number }>;
  monthlyBookLimit: number | null;
  monthlyPuzzleLimit: number | null;
  monthlyTotalLimit: number | null;
}

const PlanSchema = new Schema<IPlan>(
  {
    code:               { type: String, enum: PLAN_CODES, required: true, unique: true },
    subtitle:           { type: String, default: '' },
    badge:              { type: String, default: '' },
    features:           { type: [String], default: [] },
    excludedFeatures:   { type: [String], default: [] },
    pricing:            { type: Schema.Types.Mixed, required: true },
    monthlyBookLimit:   { type: Number, default: null },
    monthlyPuzzleLimit: { type: Number, default: null },
    monthlyTotalLimit:  { type: Number, default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IPlan>('Plan', PlanSchema);
