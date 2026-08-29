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
  planAccess: ('LITTLE_READER' | 'STAR_READER' | 'WONDER_BUNDLE')[];
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
  /** See `orderSeq` in the schema below. Not meaningful on its own. */
  orderSeq: number;
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
    planAccess:         [{ type: String, enum: ['LITTLE_READER', 'STAR_READER', 'WONDER_BUNDLE'] }],
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
    /**
     * A conflict token, not a counter anyone reads.
     *
     * Placing an order counts existing borrows to decide whether a copy is free,
     * then inserts a new borrow. Inside a transaction those reads are a snapshot,
     * but MongoDB only aborts a transaction when it writes a document another
     * transaction already wrote — and two orders for the same title insert two
     * *different* borrow documents, so nothing collides and both commit. That is
     * a phantom read, and it oversells the copy.
     *
     * Bumping this field makes the collision real: every order for a title writes
     * this one document, so the second transaction aborts, retries, re-reads the
     * now-committed borrow, and is correctly refused.
     */
    orderSeq:           { type: Number, default: 0 },
  },
  { timestamps: true }
);

BookSchema.index({ title: 'text', description: 'text', keywords: 'text' });

export default mongoose.model<IBook>('Book', BookSchema);
