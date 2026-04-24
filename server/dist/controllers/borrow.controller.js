"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listBorrows = listBorrows;
exports.requestBooks = requestBooks;
exports.assignBook = assignBook;
exports.markReturned = markReturned;
exports.listOverdue = listOverdue;
const zod_1 = require("zod");
const Borrow_js_1 = __importDefault(require("../models/Borrow.js"));
const Book_js_1 = __importDefault(require("../models/Book.js"));
const Membership_js_1 = __importDefault(require("../models/Membership.js"));
const Notification_js_1 = __importDefault(require("../models/Notification.js"));
const constants_js_1 = require("../config/constants.js");
const assignBorrowSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    bookId: zod_1.z.string().min(1),
});
const requestBooksSchema = zod_1.z.object({
    bookIds: zod_1.z.array(zod_1.z.string().min(1)).min(1),
});
async function listBorrows(req, res, next) {
    try {
        const filter = {};
        if (req.user.role !== 'ADMIN')
            filter.userId = req.user._id;
        const { status } = req.query;
        if (status)
            filter.status = status;
        const borrows = await Borrow_js_1.default.find(filter)
            .populate('userId', 'name email')
            .populate('bookId', 'title coverImage')
            .sort({ createdAt: -1 });
        res.json({ borrows });
    }
    catch (err) {
        next(err);
    }
}
async function requestBooks(req, res, next) {
    try {
        const { bookIds } = requestBooksSchema.parse(req.body);
        const uniqueBookIds = [...new Set(bookIds)];
        const membership = await Membership_js_1.default.findOne({
            userId: req.user._id,
            status: 'ACTIVE',
            endDate: { $gte: new Date() },
        });
        if (!membership) {
            return res.status(400).json({ message: 'You need an active membership to place an order' });
        }
        const now = new Date();
        const cycleMonth = now.getMonth() + 1;
        const cycleYear = now.getFullYear();
        const activeBorrowsCount = await Borrow_js_1.default.countDocuments({
            userId: req.user._id,
            cycleMonth,
            cycleYear,
            status: { $in: ['ACTIVE', 'RETURNED'] },
        });
        if (activeBorrowsCount + uniqueBookIds.length > membership.booksPerCycle) {
            return res.status(400).json({ message: 'Selected books exceed your monthly quota' });
        }
        const books = await Book_js_1.default.find({ _id: { $in: uniqueBookIds } }).populate('categoryId', 'name slug iconEmoji');
        if (books.length !== uniqueBookIds.length) {
            const foundIds = new Set(books.map((book) => String(book._id)));
            const missingBookIds = uniqueBookIds.filter((id) => !foundIds.has(String(id)));
            return res.status(404).json({ message: 'One or more books were not found', missingBookIds });
        }
        const activeBorrowCounts = await Borrow_js_1.default.aggregate([
            { $match: { bookId: { $in: books.map((book) => book._id) }, status: 'ACTIVE' } },
            { $group: { _id: '$bookId', count: { $sum: 1 } } },
        ]);
        const borrowCountMap = new Map(activeBorrowCounts.map((entry) => [entry._id.toString(), entry.count]));
        const invalidBook = books.find((book) => {
            const activeBorrowCount = borrowCountMap.get(book._id.toString()) || 0;
            return activeBorrowCount >= book.totalCopies || !book.planAccess.includes(membership.plan);
        });
        if (invalidBook) {
            return res.status(400).json({
                message: `"${invalidBook.title}" is not available for your plan or is currently unavailable`,
            });
        }
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + constants_js_1.BORROW_DURATION_DAYS);
        const borrows = await Borrow_js_1.default.create(books.map((book) => ({
            userId: req.user._id,
            bookId: book._id,
            issueDate,
            dueDate,
            cycleMonth,
            cycleYear,
        })));
        await Notification_js_1.default.insertMany(books.map((book) => ({
            userId: req.user._id,
            type: 'BOOK_ASSIGNED',
            message: `"${book.title}" has been added to your order. Due date: ${dueDate.toLocaleDateString()}.`,
        })));
        const populatedBorrows = await Borrow_js_1.default.find({ _id: { $in: borrows.map((borrow) => borrow._id) } })
            .populate('userId', 'name email')
            .populate('bookId', 'title coverImage');
        res.status(201).json({ borrows: populatedBorrows });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function assignBook(req, res, next) {
    try {
        const data = assignBorrowSchema.parse(req.body);
        const membership = await Membership_js_1.default.findOne({
            userId: data.userId, status: 'ACTIVE', endDate: { $gte: new Date() },
        });
        if (!membership)
            return res.status(400).json({ message: 'User has no active membership' });
        const now = new Date();
        const cycleMonth = now.getMonth() + 1;
        const cycleYear = now.getFullYear();
        const activeBorrowsCount = await Borrow_js_1.default.countDocuments({
            userId: data.userId, cycleMonth, cycleYear, status: { $in: ['ACTIVE', 'RETURNED'] },
        });
        if (activeBorrowsCount >= membership.booksPerCycle) {
            return res.status(400).json({ message: 'Monthly quota exhausted' });
        }
        const book = await Book_js_1.default.findById(data.bookId);
        if (!book)
            return res.status(404).json({ message: 'Book not found' });
        const bookActiveBorrows = await Borrow_js_1.default.countDocuments({ bookId: data.bookId, status: 'ACTIVE' });
        if (bookActiveBorrows >= book.totalCopies)
            return res.status(400).json({ message: 'Book not available' });
        if (!book.planAccess.includes(membership.plan)) {
            return res.status(400).json({ message: 'Book not available for your plan' });
        }
        const issueDate = new Date();
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + constants_js_1.BORROW_DURATION_DAYS);
        const borrow = await Borrow_js_1.default.create({
            userId: data.userId, bookId: data.bookId, issueDate, dueDate, cycleMonth, cycleYear,
        });
        await Notification_js_1.default.create({
            userId: data.userId, type: 'BOOK_ASSIGNED',
            message: `"${book.title}" has been assigned to you. Due date: ${dueDate.toLocaleDateString()}.`,
        });
        await borrow.populate('bookId', 'title coverImage');
        await borrow.populate('userId', 'name email');
        res.status(201).json({ borrow });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        next(err);
    }
}
async function markReturned(req, res, next) {
    try {
        const borrow = await Borrow_js_1.default.findById(req.params.id);
        if (!borrow)
            return res.status(404).json({ message: 'Borrow not found' });
        borrow.returnDate = new Date();
        borrow.status = 'RETURNED';
        await borrow.save();
        await borrow.populate('bookId', 'title coverImage');
        await borrow.populate('userId', 'name email');
        res.json({ borrow });
    }
    catch (err) {
        next(err);
    }
}
async function listOverdue(_req, res, next) {
    try {
        const borrows = await Borrow_js_1.default.find({ status: 'ACTIVE', dueDate: { $lt: new Date() } })
            .populate('userId', 'name email phone')
            .populate('bookId', 'title coverImage')
            .sort({ dueDate: 1 });
        const overdueIds = borrows.map((b) => b._id);
        if (overdueIds.length > 0)
            await Borrow_js_1.default.updateMany({ _id: { $in: overdueIds } }, { status: 'OVERDUE' });
        res.json({ borrows });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=borrow.controller.js.map