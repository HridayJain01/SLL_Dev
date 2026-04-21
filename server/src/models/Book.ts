import mongoose, { Schema, Document, Types } from 'mongoose';

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

const BookSchema = new Schema<IBook>(
  {
    title:              { type: String, required: true },
    description:        { type: String, required: true },
    coverImage:         { type: String },
    cloudinaryPublicId: { type: String },
    ageGroupMin:        { type: Number, required: true },
    ageGroupMax:        { type: Number, required: true },
    categoryId:         { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    planAccess:         [{ type: String, enum: ['NORMAL', 'PREMIUM'] }],
    totalCopies:        { type: Number, default: 1 },
  },
  { timestamps: true }
);

BookSchema.index({ title: 'text', description: 'text' });

export default mongoose.model<IBook>('Book', BookSchema);
