import mongoose, { Document, Types } from 'mongoose';
export interface IMembership extends Document {
    userId: Types.ObjectId;
    plan: 'NORMAL' | 'PREMIUM';
    durationMonths: 1 | 3 | 6 | 12;
    startDate: Date;
    endDate: Date;
    booksPerCycle: number;
    status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
    paymentProof?: string;
}
declare const _default: mongoose.Model<IMembership, {}, {}, {}, mongoose.Document<unknown, {}, IMembership, {}, {}> & IMembership & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Membership.d.ts.map