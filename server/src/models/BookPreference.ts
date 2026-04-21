import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBookPreference extends Document {
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
}

const BookPreferenceSchema = new Schema<IBookPreference>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
  },
  { timestamps: true }
);

BookPreferenceSchema.index({ userId: 1, bookId: 1 }, { unique: true });

export default mongoose.model<IBookPreference>('BookPreference', BookPreferenceSchema);
