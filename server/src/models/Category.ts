import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  iconEmoji?: string;
}

const CategorySchema = new Schema<ICategory>(
  {
    name:      { type: String, required: true, unique: true },
    slug:      { type: String, required: true, unique: true, lowercase: true },
    iconEmoji: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICategory>('Category', CategorySchema);
