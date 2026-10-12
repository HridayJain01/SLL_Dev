import mongoose, { Schema, Types } from 'mongoose';

/** One browser/device a member allowed push on. */
const PushSubscriptionSchema = new Schema(
  {
    userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys:     { p256dh: { type: String, required: true }, auth: { type: String, required: true } },
  },
  { timestamps: true }
);

export default mongoose.model<{ userId: Types.ObjectId; endpoint: string; keys: { p256dh: string; auth: string } }>(
  'PushSubscription',
  PushSubscriptionSchema
);
