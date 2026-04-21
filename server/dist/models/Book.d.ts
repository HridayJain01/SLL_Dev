import mongoose, { Document, Types } from 'mongoose';
export interface IBook extends Document {
    title: string;
    description: string;
    coverImage?: string;
    cloudinaryPublicId?: string;
    ageGroupMin: number;
    ageGroupMax: number;
    categoryId: Types.ObjectId;
    planAccess: ('NORMAL' | 'PREMIUM')[];
    totalCopies: number;
}
declare const _default: mongoose.Model<IBook, {}, {}, {}, mongoose.Document<unknown, {}, IBook, {}, {}> & IBook & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Book.d.ts.map