import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMembership extends Document {
  userId: Types.ObjectId;
  plan: 'LITTLE_READER' | 'STAR_READER' | 'WONDER_BUNDLE';
  durationMonths: 1 | 3 | 6 | 12;
  startDate: Date;
  endDate: Date;
  booksPerCycle: number;
  monthlyBookLimit?: number | null;
  monthlyPuzzleLimit?: number | null;
  monthlyTotalLimit?: number | null;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  paymentProof?: string;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan:           { type: String, enum: ['LITTLE_READER', 'STAR_READER', 'WONDER_BUNDLE'], required: true },
    durationMonths: { type: Number, enum: [1, 3, 6, 12], required: true },
    startDate:      { type: Date, required: true },
    endDate:        { type: Date, required: true },
    booksPerCycle:  { type: Number, required: true },
    monthlyBookLimit:   { type: Number, default: null },
    monthlyPuzzleLimit: { type: Number, default: null },
    monthlyTotalLimit:  { type: Number, default: null },
    status:         { type: String, enum: ['ACTIVE', 'EXPIRED', 'SUSPENDED'], default: 'ACTIVE' },
    paymentProof:   { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IMembership>('Membership', MembershipSchema);
