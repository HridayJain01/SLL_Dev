import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBookSeries {
  name: string;
  index: number;
}

export interface IBookImage {
  url: string;
  publicId: string;
}

export interface IBook extends Document {
  title: string;
  description: string;
  coverImage?: string;
  cloudinaryPublicId?: string;
  images: IBookImage[];
  ageGroupMin: number;
  ageGroupMax: number;
  categoryId: Types.ObjectId;
  planAccess: ('NORMAL' | 'PREMIUM')[];
  totalCopies: number;
  // Catalogue metadata carried over from the physical library spreadsheet
  kind: 'book' | 'puzzle';
  shelfCode?: string;
  box?: string;
  type?: string;
  series?: IBookSeries | null;
  author?: string | null;
  numPages?: number;
  coverType?: 'Hardcover' | 'Softcover';
  readingAge?: string;
  readingLevel?: 'Easy' | 'Medium' | 'Hard';
  keywords: string[];
  // Puzzle-specific
  material?: string;
  pieceCount?: number;
  // Source image filenames from the spreadsheet, used to match uploaded files
  coverImageFile?: string;
  imageFiles: string[];
}

const SeriesSchema = new Schema<IBookSeries>(
  {
    name:  { type: String, required: true },
    index: { type: Number, required: true },
  },
  { _id: false }
);

const ImageSchema = new Schema<IBookImage>(
  {
    url:      { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { _id: false }
);

const BookSchema = new Schema<IBook>(
  {
    title:              { type: String, required: true },
    description:        { type: String, required: true },
    coverImage:         { type: String },
    cloudinaryPublicId: { type: String },
    images:             { type: [ImageSchema], default: [] },
    ageGroupMin:        { type: Number, required: true },
    ageGroupMax:        { type: Number, required: true },
    categoryId:         { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    planAccess:         [{ type: String, enum: ['NORMAL', 'PREMIUM'] }],
    totalCopies:        { type: Number, default: 1 },
    // Catalogue metadata
    kind:               { type: String, enum: ['book', 'puzzle'], default: 'book' },
    shelfCode:          { type: String, unique: true, sparse: true },
    box:                { type: String },
    type:               { type: String },
    series:             { type: SeriesSchema, default: null },
    author:             { type: String, default: null },
    numPages:           { type: Number },
    coverType:          { type: String, enum: ['Hardcover', 'Softcover'] },
    readingAge:         { type: String },
    readingLevel:       { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    keywords:           [{ type: String }],
    // Puzzle-specific
    material:           { type: String },
    pieceCount:         { type: Number },
    // Source image filenames (pre-upload)
    coverImageFile:     { type: String },
    imageFiles:         [{ type: String }],
  },
  { timestamps: true }
);

BookSchema.index({ title: 'text', description: 'text', keywords: 'text' });

export default mongoose.model<IBook>('Book', BookSchema);
