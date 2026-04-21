"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBooks = listBooks;
exports.getBookById = getBookById;
exports.createBook = createBook;
exports.updateBook = updateBook;
exports.deleteBook = deleteBook;
const zod_1 = require("zod");
const Book_js_1 = __importDefault(require("../models/Book.js"));
const Borrow_js_1 = __importDefault(require("../models/Borrow.js"));
const BookPreference_js_1 = __importDefault(require("../models/BookPreference.js"));
const cloudinary_js_1 = __importDefault(require("../config/cloudinary.js"));
const stream_1 = require("stream");
const bookSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1),
    ageGroupMin: zod_1.z.coerce.number().min(0),
    ageGroupMax: zod_1.z.coerce.number().min(0),
    categoryId: zod_1.z.string().min(1),
    planAccess: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).transform((val) => typeof val === 'string' ? JSON.parse(val) : val),
    totalCopies: zod_1.z.coerce.number().min(1).default(1),
});
async function uploadToCloudinary(buffer, folder) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_js_1.default.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
            if (error || !result)
                reject(error || new Error('Upload failed'));
            else
                resolve({ secure_url: result.secure_url, public_id: result.public_id });
        });
        const readable = new stream_1.Readable();
        readable.push(buffer);
        readable.push(null);
        readable.pipe(uploadStream);
    });
}
async function listBooks(req, res, next) {
    try {
        const { category, ageMin, ageMax, plan, search, available, page = '1', limit = '12' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const filter = {};
        if (category)
            filter.categoryId = category;
        if (ageMin)
            filter.ageGroupMin = { $gte: parseInt(ageMin) };
        if (ageMax)
            filter.ageGroupMax = { $lte: parseInt(ageMax) };
        if (plan)
            filter.planAccess = plan;
        if (search)
            filter.$text = { $search: search };
        let books;
        let total;
        if (available === 'true') {
            // Use aggregation to compute available copies
            const pipeline = [
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
            const countResult = await Book_js_1.default.aggregate(countPipeline);
            total = countResult[0]?.total || 0;
            pipeline.push({ $skip: skip }, { $limit: limitNum });
            books = await Book_js_1.default.aggregate(pipeline);
            // Populate categoryId
            books = await Book_js_1.default.populate(books, { path: 'categoryId', select: 'name slug iconEmoji' });
        }
        else {
            total = await Book_js_1.default.countDocuments(filter);
            books = await Book_js_1.default.find(filter)
                .populate('categoryId', 'name slug iconEmoji')
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 });
            // Add availability info
            const bookIds = books.map((b) => b._id);
            const borrowCounts = await Borrow_js_1.default.aggregate([
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
    }
    catch (err) {
        next(err);
    }
}
async function getBookById(req, res, next) {
    try {
        const book = await Book_js_1.default.findById(req.params.id).populate('categoryId', 'name slug iconEmoji');
        if (!book)
            return res.status(404).json({ message: 'Book not found' });
        const activeBorrows = await Borrow_js_1.default.countDocuments({ bookId: book._id, status: 'ACTIVE' });
        const availableCopies = book.totalCopies - activeBorrows;
        // Similar books (same category, up to 4)
        const similarBooks = await Book_js_1.default.find({
            categoryId: book.categoryId,
            _id: { $ne: book._id },
        })
            .populate('categoryId', 'name slug iconEmoji')
            .limit(4);
        res.json({
            book: { ...book.toObject(), activeBorrowCount: activeBorrows, availableCopies },
            similarBooks,
        });
    }
    catch (err) {
        next(err);
    }
}
async function createBook(req, res, next) {
    try {
        const data = bookSchema.parse(req.body);
        let coverImage;
        let cloudinaryPublicId;
        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'star-learners-library/books');
            coverImage = result.secure_url;
            cloudinaryPublicId = result.public_id;
        }
        const book = await Book_js_1.default.create({ ...data, coverImage, cloudinaryPublicId });
        await book.populate('categoryId', 'name slug iconEmoji');
        res.status(201).json({ book });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function updateBook(req, res, next) {
    try {
        const data = bookSchema.partial().parse(req.body);
        const book = await Book_js_1.default.findById(req.params.id);
        if (!book)
            return res.status(404).json({ message: 'Book not found' });
        if (req.file) {
            // Delete old image from Cloudinary
            if (book.cloudinaryPublicId) {
                await cloudinary_js_1.default.uploader.destroy(book.cloudinaryPublicId);
            }
            const result = await uploadToCloudinary(req.file.buffer, 'star-learners-library/books');
            data.coverImage = result.secure_url;
            data.cloudinaryPublicId = result.public_id;
        }
        Object.assign(book, data);
        await book.save();
        await book.populate('categoryId', 'name slug iconEmoji');
        res.json({ book });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function deleteBook(req, res, next) {
    try {
        const book = await Book_js_1.default.findById(req.params.id);
        if (!book)
            return res.status(404).json({ message: 'Book not found' });
        if (book.cloudinaryPublicId) {
            await cloudinary_js_1.default.uploader.destroy(book.cloudinaryPublicId);
        }
        await Book_js_1.default.findByIdAndDelete(req.params.id);
        await Borrow_js_1.default.deleteMany({ bookId: req.params.id });
        await BookPreference_js_1.default.deleteMany({ bookId: req.params.id });
        res.json({ message: 'Book deleted successfully' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=book.controller.js.map