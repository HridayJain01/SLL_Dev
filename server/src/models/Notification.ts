import mongoose, { Schema, Document, Types } from 'mongoose';
import { pushNotifications } from '../lib/push.js';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'DUE_REMINDER' | 'MEMBERSHIP_EXPIRY' | 'BOOK_ASSIGNED' | 'DELIVERY_ASSIGNED' | 'ORDER_RETURNED' | 'BACK_IN_STOCK' | 'NEW_ARRIVAL' | 'GENERAL';
  message: string;
  isRead: boolean;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId:  { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type:    { type: String, enum: ['DUE_REMINDER', 'MEMBERSHIP_EXPIRY', 'BOOK_ASSIGNED', 'DELIVERY_ASSIGNED', 'ORDER_RETURNED', 'BACK_IN_STOCK', 'NEW_ARRIVAL', 'GENERAL'], required: true },
    message: { type: String, required: true },
    isRead:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Every notification, from any controller, also goes out as a web push.
NotificationSchema.post('save', async function (doc) { await pushNotifications([doc]); });
NotificationSchema.post('insertMany', async function (docs: INotification[]) { await pushNotifications(docs); });

export default mongoose.model<INotification>('Notification', NotificationSchema);
