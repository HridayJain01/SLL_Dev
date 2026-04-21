import mongoose, { Document, Types } from 'mongoose';
export interface IBookPreference extends Document {
    userId: Types.ObjectId;
    bookId: Types.ObjectId;
}
declare const _default: mongoose.Model<IBookPreference, {}, {}, {}, mongoose.Document<unknown, {}, IBookPreference, {}, {}> & IBookPreference & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=BookPreference.d.ts.map