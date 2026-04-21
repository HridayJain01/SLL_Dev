import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Book from '../models/Book.js';
import Borrow from '../models/Borrow.js';
import BookPreference from '../models/BookPreference.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

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
});

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

export async function listBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, ageMin, ageMax, plan, search, available, page = '1', limit = '12' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (category) filter.categoryId = category;
    if (ageMin) filter.ageGroupMin = { $gte: parseInt(ageMin as string) };
    if (ageMax) filter.ageGroupMax = { $lte: parseInt(ageMax as string) };
    if (plan) filter.planAccess = plan;
    if (search) filter.$text = { $search: search as string };

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
              { $match: { $expr: { $and: [{ $eq: ['$bookId', '$$bookId'] }, { $eq: ['$status', 'ACTIVE'] }] } } },
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

      pipeline.push({ $skip: skip }, { $limit: limitNum });
      books = await Book.aggregate(pipeline);

      // Populate categoryId
      books = await Book.populate(books, { path: 'categoryId', select: 'name slug iconEmoji' });
    } else {
      total = await Book.countDocuments(filter);
      books = await Book.find(filter)
        .populate('categoryId', 'name slug iconEmoji')
        .skip(skip)
        .limit(limitNum)
        .sort({ createdAt: -1 });

      // Add availability info
      const bookIds = books.map((b) => b._id);
      const borrowCounts = await Borrow.aggregate([
        { $match: { bookId: { $in: bookIds }, status: 'ACTIVE' } },
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

    const activeBorrows = await Borrow.countDocuments({ bookId: book._id, status: 'ACTIVE' });
    const availableCopies = book.totalCopies - activeBorrows;

    // Similar books (same category, up to 4)
    const similarBooks = await Book.find({
      categoryId: book.categoryId,
      _id: { $ne: book._id },
    })
      .populate('categoryId', 'name slug iconEmoji')
      .limit(4);

    res.json({
      book: { ...book.toObject(), activeBorrowCount: activeBorrows, availableCopies },
      similarBooks,
    });
  } catch (err) {
    next(err);
  }
}

export async function createBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = bookSchema.parse(req.body);

    let coverImage: string | undefined;
    let cloudinaryPublicId: string | undefined;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'star-learners-library/books');
      coverImage = result.secure_url;
      cloudinaryPublicId = result.public_id;
    }

    const book = await Book.create({ ...data, coverImage, cloudinaryPublicId });
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

    if (req.file) {
      // Delete old image from Cloudinary
      if (book.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(book.cloudinaryPublicId);
      }
      const result = await uploadToCloudinary(req.file.buffer, 'star-learners-library/books');
      (data as any).coverImage = result.secure_url;
      (data as any).cloudinaryPublicId = result.public_id;
    }

    Object.assign(book, data);
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

    if (book.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(book.cloudinaryPublicId);
    }

    await Book.findByIdAndDelete(req.params.id);
    await Borrow.deleteMany({ bookId: req.params.id });
    await BookPreference.deleteMany({ bookId: req.params.id });

    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    next(err);
  }
}
