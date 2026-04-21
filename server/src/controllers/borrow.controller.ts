import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Borrow from '../models/Borrow.js';
import Book from '../models/Book.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import { AuthRequest } from '../middleware/auth.js';
import { BORROW_DURATION_DAYS } from '../config/constants.js';

const assignBorrowSchema = z.object({
  userId: z.string().min(1),
  bookId: z.string().min(1),
});

export async function listBorrows(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter: any = {};
    if (req.user.role !== 'ADMIN') filter.userId = req.user._id;
    const { status } = req.query;
    if (status) filter.status = status;
    const borrows = await Borrow.find(filter)
      .populate('userId', 'name email')
      .populate('bookId', 'title coverImage')
      .sort({ createdAt: -1 });
    res.json({ borrows });
  } catch (err) { next(err); }
}

export async function assignBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = assignBorrowSchema.parse(req.body);
    const membership = await Membership.findOne({
      userId: data.userId, status: 'ACTIVE', endDate: { $gte: new Date() },
    });
    if (!membership) return res.status(400).json({ message: 'User has no active membership' });

    const now = new Date();
    const cycleMonth = now.getMonth() + 1;
    const cycleYear = now.getFullYear();
    const activeBorrowsCount = await Borrow.countDocuments({
      userId: data.userId, cycleMonth, cycleYear, status: { $in: ['ACTIVE', 'RETURNED'] },
    });
    if (activeBorrowsCount >= membership.booksPerCycle) {
      return res.status(400).json({ message: 'Monthly quota exhausted' });
    }

    const book = await Book.findById(data.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const bookActiveBorrows = await Borrow.countDocuments({ bookId: data.bookId, status: 'ACTIVE' });
    if (bookActiveBorrows >= book.totalCopies) return res.status(400).json({ message: 'Book not available' });
    if (!book.planAccess.includes(membership.plan)) {
      return res.status(400).json({ message: 'Book not available for your plan' });
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

    const borrow = await Borrow.create({
      userId: data.userId, bookId: data.bookId, issueDate, dueDate, cycleMonth, cycleYear,
    });

    await Notification.create({
      userId: data.userId, type: 'BOOK_ASSIGNED',
      message: `"${book.title}" has been assigned to you. Due date: ${dueDate.toLocaleDateString()}.`,
    });

    await borrow.populate('bookId', 'title coverImage');
    await borrow.populate('userId', 'name email');
    res.status(201).json({ borrow });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

export async function markReturned(req: Request, res: Response, next: NextFunction) {
  try {
    const borrow = await Borrow.findById(req.params.id);
    if (!borrow) return res.status(404).json({ message: 'Borrow not found' });
    borrow.returnDate = new Date();
    borrow.status = 'RETURNED';
    await borrow.save();
    await borrow.populate('bookId', 'title coverImage');
    await borrow.populate('userId', 'name email');
    res.json({ borrow });
  } catch (err) { next(err); }
}

export async function listOverdue(_req: Request, res: Response, next: NextFunction) {
  try {
    const borrows = await Borrow.find({ status: 'ACTIVE', dueDate: { $lt: new Date() } })
      .populate('userId', 'name email phone')
      .populate('bookId', 'title coverImage')
      .sort({ dueDate: 1 });
    const overdueIds = borrows.map((b) => b._id);
    if (overdueIds.length > 0) await Borrow.updateMany({ _id: { $in: overdueIds } }, { status: 'OVERDUE' });
    res.json({ borrows });
  } catch (err) { next(err); }
}
