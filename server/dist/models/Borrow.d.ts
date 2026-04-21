import mongoose, { Document, Types } from 'mongoose';
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
declare const _default: mongoose.Model<IBorrow, {}, {}, {}, mongoose.Document<unknown, {}, IBorrow, {}, {}> & IBorrow & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Borrow.d.ts.map