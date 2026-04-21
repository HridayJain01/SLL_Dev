import mongoose, { Document, Types } from 'mongoose';
export interface INotification extends Document {
    userId: Types.ObjectId;
    type: 'DUE_REMINDER' | 'MEMBERSHIP_EXPIRY' | 'BOOK_ASSIGNED' | 'GENERAL';
    message: string;
    isRead: boolean;
}
declare const _default: mongoose.Model<INotification, {}, {}, {}, mongoose.Document<unknown, {}, INotification, {}, {}> & INotification & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Notification.d.ts.map