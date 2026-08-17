import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Types } from 'mongoose';
import Book from '../models/Book.js';
import Borrow from '../models/Borrow.js';
import BookPreference from '../models/BookPreference.js';
import { AuthRequest } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';
import { normalizePlanAccess } from '../config/constants.js';

const bookSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  ageGroupMin: z.coerce.number().min(0),
  ageGroupMax: z.coerce.number().min(0),
  categoryId: z.string().min(1),
  planAccess: z.union([z.string(), z.array(z.string())]).transform((val) =>
    typeof val === 'string' ? JSON.parse(val) : val
  ),
  totalCopies: z.coerce.number().min(1).default(1),
  // Catalogue metadata — manageable via the admin form
  series: z.preprocess(
    (v) => {
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (!trimmed || trimmed === 'null') return null;
        try { return JSON.parse(trimmed); } catch { return null; }
      }
      return v ?? null;
    },
    z.union([
      z.object({ name: z.string().min(1), index: z.coerce.number().int().min(1) }),
      z.null(),
    ]).optional()
  ),
  author: z.string().nullable().optional(),
  numPages: z.coerce.number().int().positive().optional(),
  coverType: z.enum(['Hardcover', 'Softcover']).optional(),
  readingLevel: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  readingAge: z.string().optional(),
  kind: z.enum(['book', 'puzzle']).optional().default('book'),
});

const BOOK_IMAGE_FOLDER = 'star-learners-library/books';

async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error || !result) reject(error || new Error('Upload failed'));
        else resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

// The first image in the gallery is always the displayed cover.
function syncCover(book: any) {
  const first = book.images?.[0];
  book.coverImage = first?.url;
  book.cloudinaryPublicId = first?.publicId;
}

type BookImage = { url: string; publicId: string };
type ManifestItem = { type: 'existing' | 'new'; publicId?: string };

// Builds the final, ordered image gallery from the request.
// - `req.files` holds newly uploaded files (field name "images"), in order.
// - `imageManifest` (JSON) describes the desired final order, mixing kept
//   existing images (by publicId) with placeholders for each new upload.
// When no manifest is sent we simply keep existing images and append new ones.
// Returns the ordered gallery plus any existing images that were dropped so the
// caller can clean them up in Cloudinary.
async function resolveBookImages(
  req: Request,
  existing: BookImage[] = []
): Promise<{ images: BookImage[]; removed: BookImage[] }> {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  const uploaded: BookImage[] = [];
  for (const file of files) {
    const result = await uploadToCloudinary(file.buffer, BOOK_IMAGE_FOLDER);
    uploaded.push({ url: result.secure_url, publicId: result.public_id });
  }

  let manifest: ManifestItem[] | null = null;
  if (typeof req.body.imageManifest === 'string' && req.body.imageManifest.trim()) {
    try {
      const parsed = JSON.parse(req.body.imageManifest);
      if (Array.isArray(parsed)) manifest = parsed;
    } catch {
      manifest = null;
    }
  }

  let images: BookImage[];
  if (manifest) {
    images = [];
    let newIndex = 0;
    for (const item of manifest) {
      if (item.type === 'new') {
        if (uploaded[newIndex]) images.push(uploaded[newIndex++]);
      } else {
        const match = existing.find((img) => img.publicId === item.publicId);
        if (match) images.push(match);
      }
    }
    // Safety: never silently drop an uploaded file the manifest forgot.
    while (newIndex < uploaded.length) images.push(uploaded[newIndex++]);
  } else {
    images = [...existing, ...uploaded];
  }

  const kept = new Set(images.map((img) => img.publicId));
  const removed = existing.filter((img) => !kept.has(img.publicId));
  return { images, removed };
}

export async function listBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, ageMin, ageMax, plan, search, available, kind, sort, excludeSeries, page = '1', limit = '12' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (category) filter.categoryId = category;
    if (plan) filter.planAccess = plan;
    if (kind === 'book' || kind === 'puzzle') filter.kind = kind;
    if (search) filter.$text = { $search: search as string };
    // When grouping series into their own cards, drop series-member books from
    // the flat listing so they aren't shown twice.
    if (excludeSeries === 'true') filter.series = null;

    // Age-band overlap: a title matches band [min,max] when its own age range
    // intersects the band, i.e. ageGroupMin <= max AND ageGroupMax >= min.
    const ageConds: any[] = [];
    if (ageMax) ageConds.push({ ageGroupMin: { $lte: parseInt(ageMax as string) } });
    if (ageMin) ageConds.push({ ageGroupMax: { $gte: parseInt(ageMin as string) } });
    if (ageConds.length) filter.$and = ageConds;

    // Sort options shared by both query paths.
    const sortSpec: Record<string, 1 | -1> =
      sort === 'title-asc'   ? { title: 1 } :
      sort === 'title-desc'  ? { title: -1 } :
      sort === 'oldest'      ? { createdAt: 1 } :
                               { createdAt: -1 }; // newest / default

    let books;
    let total;

    if (available === 'true') {
      // Use aggregation to compute available copies
      const pipeline: any[] = [
        { $match: filter },
        {
          $lookup: {
            from: 'borrows',
            let: { bookId: '$_id' },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$bookId', '$$bookId'] }, { $ne: ['$status', 'RETURNED'] }] } } },
            ],
            as: 'activeBorrows',
          },
        },
        { $addFields: { activeBorrowCount: { $size: '$activeBorrows' }, availableCopies: { $subtract: ['$totalCopies', { $size: '$activeBorrows' }] } } },
        { $match: { availableCopies: { $gt: 0 } } },
        { $project: { activeBorrows: 0 } },
      ];

      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await Book.aggregate(countPipeline);
      total = countResult[0]?.total || 0;

      pipeline.push({ $sort: sortSpec }, { $skip: skip }, { $limit: limitNum });
      books = await Book.aggregate(pipeline);

      // Populate categoryId
      books = await Book.populate(books, { path: 'categoryId', select: 'name slug iconEmoji' });
    } else {
      total = await Book.countDocuments(filter);
      books = await Book.find(filter)
        .populate('categoryId', 'name slug iconEmoji')
        .skip(skip)
        .limit(limitNum)
        .sort(sortSpec);

      // Add availability info
      const bookIds = books.map((b) => b._id);
      const borrowCounts = await Borrow.aggregate([
        { $match: { bookId: { $in: bookIds }, status: { $ne: 'RETURNED' } } },
        { $group: { _id: '$bookId', count: { $sum: 1 } } },
      ]);

      const borrowMap = new Map(borrowCounts.map((b) => [b._id.toString(), b.count]));
      books = books.map((book) => {
        const bookObj = book.toObject();
        const activeBorrows = borrowMap.get(book._id.toString()) || 0;
        return { ...bookObj, activeBorrowCount: activeBorrows, availableCopies: book.totalCopies - activeBorrows };
      });
    }

    res.json({
      books,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getBookById(req: Request, res: Response, next: NextFunction) {
  try {
    const book = await Book.findById(req.params.id).populate('categoryId', 'name slug iconEmoji');
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // A copy is unavailable until it is physically back, whatever stage of the
    // delivery/pickup journey it is at and whether or not it is overdue.
    const activeBorrows = await Borrow.countDocuments({ bookId: book._id, status: { $ne: 'RETURNED' } });
    const availableCopies = book.totalCopies - activeBorrows;

    // Similar books (same category, up to 4, excluding current)
    const similarBooks = await Book.find({
      categoryId: book.categoryId,
      _id: { $ne: book._id },
    })
      .populate('categoryId', 'name slug iconEmoji')
      .limit(4);

    // All books in the same series, sorted by index (includes current book)
    let seriesBooks: any[] = [];
    if (book.series?.name) {
      seriesBooks = await Book.find({ 'series.name': book.series.name })
        .populate('categoryId', 'name slug iconEmoji')
        .sort({ 'series.index': 1 });
    }

    res.json({
      book: { ...book.toObject(), activeBorrowCount: activeBorrows, availableCopies },
      similarBooks,
      seriesBooks,
    });
  } catch (err) {
    next(err);
  }
}

// Attaches activeBorrowCount / availableCopies to a list of plain book objects,
// mirroring the availability info listBooks returns.
async function withAvailability(books: any[]): Promise<any[]> {
  if (!books.length) return books;
  const bookIds = books.map((b) => b._id);
  const borrowCounts = await Borrow.aggregate([
    { $match: { bookId: { $in: bookIds }, status: { $ne: 'RETURNED' } } },
    { $group: { _id: '$bookId', count: { $sum: 1 } } },
  ]);
  const borrowMap = new Map(borrowCounts.map((b) => [b._id.toString(), b.count]));
  return books.map((book) => {
    const activeBorrows = borrowMap.get(book._id.toString()) || 0;
    return { ...book, activeBorrowCount: activeBorrows, availableCopies: book.totalCopies - activeBorrows };
  });
}

// Personalised picks for the dashboard, based on the books the user has
// previously borrowed: we surface other titles in the same categories and age
// range, excluding anything they've already had. When there's no history yet
// (new member) we fall back to the newest additions to the catalogue.
export async function getRecommendedBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) || '6'), 12);

    // Everything the user has ever borrowed (active or returned).
    const history = await Borrow.find({ userId: req.user._id })
      .populate('bookId', 'categoryId ageGroupMin ageGroupMax')
      .lean();

    const borrowedIds = history.map((b: any) => b.bookId?._id).filter(Boolean);
    const categoryIds = new Set<string>();
    let ageMin = Infinity;
    let ageMax = -Infinity;
    for (const h of history as any[]) {
      const book = h.bookId;
      if (!book) continue;
      categoryIds.add(book.categoryId.toString());
      ageMin = Math.min(ageMin, book.ageGroupMin);
      ageMax = Math.max(ageMax, book.ageGroupMax);
    }

    let books: any[] = [];
    let basis: 'history' | 'newest' = 'newest';

    if (categoryIds.size > 0) {
      basis = 'history';
      books = await Book.find({
        _id: { $nin: borrowedIds },
        categoryId: { $in: [...categoryIds].map((id) => new Types.ObjectId(id)) },
        // Overlap with the age range the user has read in.
        ageGroupMin: { $lte: ageMax },
        ageGroupMax: { $gte: ageMin },
      })
        .populate('categoryId', 'name slug iconEmoji')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
    }

    // Backfill (or fully populate for new members) with the newest titles.
    if (books.length < limit) {
      const exclude = [...borrowedIds, ...books.map((b) => b._id)];
      const filler = await Book.find({ _id: { $nin: exclude } })
        .populate('categoryId', 'name slug iconEmoji')
        .sort({ createdAt: -1 })
        .limit(limit - books.length)
        .lean();
      books = [...books, ...filler];
    }

    res.json({ books: await withAvailability(books), basis });
  } catch (err) {
    next(err);
  }
}

export async function createBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bookSchema.parse(req.body);
    const normalizedData = {
      ...data,
      planAccess: normalizePlanAccess(data.planAccess, data.kind ?? 'book'),
    };

    const { images } = await resolveBookImages(req, []);

    const book = new Book({ ...normalizedData, images });
    syncCover(book);
    await book.save();
    await book.populate('categoryId', 'name slug iconEmoji');
    res.status(201).json({ book });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bookSchema.partial().parse(req.body);
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const nextKind = data.kind ?? book.kind ?? 'book';
    const normalizedData = {
      ...data,
      planAccess: data.planAccess ? normalizePlanAccess(data.planAccess, nextKind) : undefined,
    };

    Object.assign(book, normalizedData);

    const hasFiles = ((req.files as Express.Multer.File[] | undefined)?.length ?? 0) > 0;
    const hasManifest =
      typeof req.body.imageManifest === 'string' && req.body.imageManifest.trim().length > 0;

    // Only touch the gallery when the client actually sent image changes, so a
    // metadata-only update (e.g. adjusting copies) leaves the images untouched.
    if (hasFiles || hasManifest) {
      const existing = (book.images ?? []).map((img: any) => ({ url: img.url, publicId: img.publicId }));
      const { images, removed } = await resolveBookImages(req, existing);
      for (const img of removed) {
        if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
      }
      book.images = images as any;
      syncCover(book);
    }

    await book.save();
    await book.populate('categoryId', 'name slug iconEmoji');
    res.json({ book });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function deleteBook(req: Request, res: Response, next: NextFunction) {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    // Clean up the whole gallery, not just the cover, so removing a title does
    // not orphan its other uploads in Cloudinary.
    const publicIds = new Set(
      [book.cloudinaryPublicId, ...(book.images ?? []).map((img) => img.publicId)].filter(
        Boolean
      ) as string[]
    );
    for (const publicId of publicIds) {
      await cloudinary.uploader.destroy(publicId);
    }

    await Book.findByIdAndDelete(req.params.id);
    await Borrow.deleteMany({ bookId: req.params.id });
    await BookPreference.deleteMany({ bookId: req.params.id });

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    next(err);
  }
}
