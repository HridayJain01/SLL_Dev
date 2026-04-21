import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBorrow extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  cycleMonth: number;
  cycleYear: number;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
}

const BorrowSchema = new Schema<IBorrow>(
  {
    userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId:     { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    issueDate:  { type: Date, default: Date.now },
    dueDate:    { type: Date, required: true },
    returnDate: { type: Date },
    cycleMonth: { type: Number, required: true },
    cycleYear:  { type: Number, required: true },
    status:     { type: String, enum: ['ACTIVE', 'RETURNED', 'OVERDUE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

export default mongoose.model<IBorrow>('Borrow', BorrowSchema);
