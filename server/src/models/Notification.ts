import mongoose, { Schema, Document, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'DUE_REMINDER' | 'MEMBERSHIP_EXPIRY' | 'BOOK_ASSIGNED' | 'GENERAL';
  message: string;
  isRead: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, enum: ['DUE_REMINDER', 'MEMBERSHIP_EXPIRY', 'BOOK_ASSIGNED', 'GENERAL'], required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
