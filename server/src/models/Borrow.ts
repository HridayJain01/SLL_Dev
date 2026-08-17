import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * One physical item on loan.
 *
 * Two orthogonal axes, deliberately kept apart:
 *
 *  - `status` answers "is this copy back on the shelf?" — ACTIVE or RETURNED,
 *    nothing else. Availability and monthly quota both key off this, so it must
 *    never be overloaded with logistics or lateness.
 *  - `fulfilment` answers "where is it right now?" — the journey out to the
 *    member and back again.
 *
 * Overdue is deliberately *not* a status. It is derived from `dueDate`, which
 * only exists once the box actually reached the member. Storing it as a status
 * is what previously let a late book read as available stock.
 */

export type BorrowStatus = 'ACTIVE' | 'RETURNED';

export type BorrowFulfilment =
  /** Ordered, still being packed. No due date yet. */
  | 'PREPARING'
  /** A delivery partner is carrying it to the member. */
  | 'OUT_FOR_DELIVERY'
  /** Handed over. `deliveredAt` and `dueDate` are set from this point. */
  | 'WITH_MEMBER'
  /** Member asked for it to be collected. */
  | 'RETURN_REQUESTED'
  /** A pickup partner is assigned to collect it. */
  | 'PICKUP_SCHEDULED'
  /** Back with the library. Terminal; pairs with status RETURNED. */
  | 'COLLECTED';

/** Fulfilment states in which the member physically holds the book. */
export const FULFILMENT_WITH_MEMBER: BorrowFulfilment[] = [
  'WITH_MEMBER',
  'RETURN_REQUESTED',
  'PICKUP_SCHEDULED',
];

/** Fulfilment states that still owe the member a delivery. */
export const FULFILMENT_INBOUND: BorrowFulfilment[] = ['PREPARING', 'OUT_FOR_DELIVERY'];

export interface ILeg {
  partnerName?: string;
  partnerPhone?: string;
  eta?: string;
  assignedAt?: Date;
  completedAt?: Date;
}

export interface IBorrow extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  /** When the member placed the order. Batches share this exact value. */
  issueDate: Date;
  /** When the book reached the member. Undefined until delivery is confirmed. */
  deliveredAt?: Date;
  /** Set at delivery, not at checkout, so transit never eats the loan period. */
  dueDate?: Date;
  returnDate?: Date;
  returnRequested: boolean;
  returnRequestedAt?: Date;
  cycleMonth: number;
  cycleYear: number;
  status: BorrowStatus;
  fulfilment: BorrowFulfilment;
  /** Library to member. */
  delivery: ILeg;
  /** Member back to library. Kept separate so neither leg overwrites the other. */
  pickup: ILeg;
}

const LegSchema = new Schema<ILeg>(
  {
    partnerName:  { type: String },
    partnerPhone: { type: String },
    eta:          { type: String },
    assignedAt:   { type: Date },
    completedAt:  { type: Date },
  },
  { _id: false }
);

const BorrowSchema = new Schema<IBorrow>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId:     { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    issueDate:  { type: Date, default: Date.now },
    deliveredAt: { type: Date },
    dueDate:    { type: Date },
    returnDate: { type: Date },
    returnRequested:   { type: Boolean, default: false },
    returnRequestedAt: { type: Date },
    cycleMonth: { type: Number, required: true },
    cycleYear:  { type: Number, required: true },
    status:     { type: String, enum: ['ACTIVE', 'RETURNED'], default: 'ACTIVE' },
    fulfilment: {
      type: String,
      enum: [
        'PREPARING',
        'OUT_FOR_DELIVERY',
        'WITH_MEMBER',
        'RETURN_REQUESTED',
        'PICKUP_SCHEDULED',
        'COLLECTED',
      ],
      default: 'PREPARING',
    },
    delivery: { type: LegSchema, default: () => ({}) },
    pickup:   { type: LegSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Availability lookups filter borrows by book + status on every catalogue request.
BorrowSchema.index({ bookId: 1, status: 1 });
BorrowSchema.index({ userId: 1, status: 1 });
// The admin circulation queues page through fulfilment, and the overdue report
// scans due dates among books that are actually out.
BorrowSchema.index({ fulfilment: 1, issueDate: -1 });
BorrowSchema.index({ status: 1, dueDate: 1 });
// Quota is counted per member per calendar cycle.
BorrowSchema.index({ userId: 1, cycleYear: 1, cycleMonth: 1 });

export default mongoose.model<IBorrow>('Borrow', BorrowSchema);
