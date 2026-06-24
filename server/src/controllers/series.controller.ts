import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Readable } from 'stream';
import Series from '../models/Series.js';
import Book from '../models/Book.js';
import Borrow from '../models/Borrow.js';
import cloudinary from '../config/cloudinary.js';

const SERIES_IMAGE_FOLDER = 'star-learners-library/series';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function uploadToCloudinary(buffer: Buffer): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: SERIES_IMAGE_FOLDER, resource_type: 'image' },
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

const seriesSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// Aggregate the series that actually have books, deriving cover/age range from
// their members, then enrich with any admin-managed Series document metadata.
async function deriveSeriesFromBooks() {
  return Book.aggregate([
    { $match: { 'series.name': { $type: 'string' } } },
    { $sort: { 'series.index': 1 } },
    {
      $group: {
        _id: '$series.name',
        bookCount: { $sum: 1 },
        ageGroupMin: { $min: '$ageGroupMin' },
        ageGroupMax: { $max: '$ageGroupMax' },
        sampleCover: { $first: '$coverImage' },
      },
    },
  ]);
}

export async function listSeries(_req: Request, res: Response, next: NextFunction) {
  try {
    const [derived, docs] = await Promise.all([deriveSeriesFromBooks(), Series.find()]);

    const docByName = new Map(docs.map((d) => [d.name, d]));
    const seen = new Set<string>();

    const series = derived.map((d) => {
      const name = d._id as string;
      seen.add(name);
      const doc = docByName.get(name);
      return {
        _id: doc?._id ?? null,
        name,
        slug: doc?.slug ?? slugify(name),
        description: doc?.description ?? null,
        coverImage: doc?.coverImage ?? d.sampleCover ?? null,
        bookCount: d.bookCount as number,
        ageGroupMin: d.ageGroupMin as number,
        ageGroupMax: d.ageGroupMax as number,
        managed: !!doc,
      };
    });

    // Include admin-created series that have no books yet (useful in the admin UI).
    for (const doc of docs) {
      if (seen.has(doc.name)) continue;
      series.push({
        _id: doc._id,
        name: doc.name,
        slug: doc.slug,
        description: doc.description ?? null,
        coverImage: doc.coverImage ?? null,
        bookCount: 0,
        ageGroupMin: 0,
        ageGroupMax: 0,
        managed: true,
      });
    }

    series.sort((a, b) => a.name.localeCompare(b.name));
    res.json({ series });
  } catch (err) {
    next(err);
  }
}

export async function getSeriesBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const { slug } = req.params;

    // Resolve the canonical series name from the slug: prefer an admin-managed
    // Series document, otherwise reverse-match against the books' series names.
    let doc = await Series.findOne({ slug });
    let name = doc?.name;
    if (!name) {
      const names: string[] = await Book.distinct('series.name', { 'series.name': { $type: 'string' } });
      name = names.find((n) => slugify(n) === slug);
    }
    if (!name) return res.status(404).json({ message: 'Series not found' });

    if (!doc) doc = await Series.findOne({ name });

    const books = await Book.find({ 'series.name': name })
      .populate('categoryId', 'name slug iconEmoji')
      .sort({ 'series.index': 1 });

    // Attach availability (mirrors the books listing logic).
    const bookIds = books.map((b) => b._id);
    const borrowCounts = await Borrow.aggregate([
      { $match: { bookId: { $in: bookIds }, status: 'ACTIVE' } },
      { $group: { _id: '$bookId', count: { $sum: 1 } } },
    ]);
    const borrowMap = new Map(borrowCounts.map((b) => [b._id.toString(), b.count]));
    const booksWithAvailability = books.map((book) => {
      const obj = book.toObject();
      const active = borrowMap.get(book._id.toString()) || 0;
      return { ...obj, activeBorrowCount: active, availableCopies: book.totalCopies - active };
    });

    const ageMin = books.length ? Math.min(...books.map((b) => b.ageGroupMin)) : 0;
    const ageMax = books.length ? Math.max(...books.map((b) => b.ageGroupMax)) : 0;
    const coverImage = doc?.coverImage ?? books[0]?.coverImage ?? null;

    res.json({
      series: {
        _id: doc?._id ?? null,
        name,
        slug: doc?.slug ?? slugify(name),
        description: doc?.description ?? null,
        coverImage,
        bookCount: books.length,
        ageGroupMin: ageMin,
        ageGroupMax: ageMax,
        managed: !!doc,
      },
      books: booksWithAvailability,
    });
  } catch (err) {
    next(err);
  }
}

export async function createSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const data = seriesSchema.parse(req.body);
    const slug = slugify(data.name);

    const exists = await Series.findOne({ $or: [{ name: data.name }, { slug }] });
    if (exists) return res.status(409).json({ message: 'A series with this name already exists' });

    let coverImage: string | undefined;
    let cloudinaryPublicId: string | undefined;
    const file = req.file as Express.Multer.File | undefined;
    if (file) {
      const result = await uploadToCloudinary(file.buffer);
      coverImage = result.secure_url;
      cloudinaryPublicId = result.public_id;
    }

    const series = await Series.create({ ...data, slug, coverImage, cloudinaryPublicId });
    res.status(201).json({ series });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const data = seriesSchema.partial().parse(req.body);
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });

    if (data.name !== undefined && data.name !== series.name) {
      const slug = slugify(data.name);
      const clash = await Series.findOne({ _id: { $ne: series._id }, $or: [{ name: data.name }, { slug }] });
      if (clash) return res.status(409).json({ message: 'A series with this name already exists' });
      series.name = data.name;
      series.slug = slug;
    }
    if (data.description !== undefined) series.description = data.description;

    const file = req.file as Express.Multer.File | undefined;
    if (file) {
      if (series.cloudinaryPublicId) await cloudinary.uploader.destroy(series.cloudinaryPublicId);
      const result = await uploadToCloudinary(file.buffer);
      series.coverImage = result.secure_url;
      series.cloudinaryPublicId = result.public_id;
    }

    await series.save();
    res.json({ series });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function deleteSeries(req: Request, res: Response, next: NextFunction) {
  try {
    const series = await Series.findById(req.params.id);
    if (!series) return res.status(404).json({ message: 'Series not found' });

    if (series.cloudinaryPublicId) await cloudinary.uploader.destroy(series.cloudinaryPublicId);
    await Series.findByIdAndDelete(req.params.id);

    // Books keep their embedded series grouping; only the managed metadata is removed.
    res.json({ message: 'Series deleted successfully' });
  } catch (err) {
    next(err);
  }
}
