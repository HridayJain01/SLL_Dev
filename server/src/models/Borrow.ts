import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBorrow extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  returnRequested: boolean;
  returnRequestedAt?: Date;
  cycleMonth: number;
  cycleYear: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  // Delivery / pickup logistics
  deliveryStatus: 'UNASSIGNED' | 'ASSIGNED' | 'COMPLETED';
  deliveryType?: 'DELIVERY' | 'PICKUP';
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
  deliveryAssignedAt?: Date;
}

const BorrowSchema = new Schema<IBorrow>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId:     { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    issueDate:  { type: Date, default: Date.now },
    dueDate:    { type: Date, required: true },
    returnDate: { type: Date },
    returnRequested:   { type: Boolean, default: false },
    returnRequestedAt: { type: Date },
    cycleMonth: { type: Number, required: true },
    cycleYear:  { type: Number, required: true },
    status:     { type: String, enum: ['ACTIVE', 'RETURNED', 'OVERDUE'], default: 'ACTIVE' },
    // Delivery / pickup logistics
    deliveryStatus:      { type: String, enum: ['UNASSIGNED', 'ASSIGNED', 'COMPLETED'], default: 'UNASSIGNED' },
    deliveryType:        { type: String, enum: ['DELIVERY', 'PICKUP'] },
    deliveryPersonName:  { type: String },
    deliveryPersonPhone: { type: String },
    deliveryAssignedAt:  { type: Date },
  },
  { timestamps: true }
);

// Availability lookups filter borrows by book + status on every catalogue request.
BorrowSchema.index({ bookId: 1, status: 1 });
BorrowSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IBorrow>('Borrow', BorrowSchema);
