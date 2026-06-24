import mongoose, { Schema, Document } from 'mongoose';

export interface ISeries extends Document {
  name: string;
  slug: string;
  description?: string;
  coverImage?: string;
  cloudinaryPublicId?: string;
}

const SeriesSchema = new Schema<ISeries>(
  {
    // `name` is the join key: books belong to a series via their embedded
    // `series.name`. It must match the series name set on those books.
    name:               { type: String, required: true, unique: true },
    slug:               { type: String, required: true, unique: true, lowercase: true, index: true },
    description:        { type: String },
    coverImage:         { type: String },
    cloudinaryPublicId: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ISeries>('Series', SeriesSchema);
