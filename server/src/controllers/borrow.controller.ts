import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Borrow from '../models/Borrow.js';
import Book from '../models/Book.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { BORROW_DURATION_DAYS, getPlanAllowance, getPlanLabel, isPlanAllowedForBook } from '../config/constants.js';
import { emailService, EmailItem } from '../lib/email/index.js';

const assignBorrowSchema = z.object({
  userId: z.string().min(1),
  bookId: z.string().min(1),
});

const requestBooksSchema = z.object({
  bookIds: z.array(z.string().min(1)).min(1),
});

function getMembershipAllowanceSummary(membership: any) {
  const fallback = getPlanAllowance(membership.plan);
  return {
    monthlyBookLimit: membership.monthlyBookLimit ?? fallback.monthlyBookLimit,
    monthlyPuzzleLimit: membership.monthlyPuzzleLimit ?? fallback.monthlyPuzzleLimit,
    monthlyTotalLimit: membership.monthlyTotalLimit ?? fallback.monthlyTotalLimit,
  };
}

function buildQuotaError(
  label: 'book' | 'puzzle' | 'item',
  limit: number,
  requested: number,
  used: number
) {
  const remaining = Math.max(0, limit - used);
  if (label === 'item') {
    return `This plan allows ${limit} total items per month. You have ${remaining} slot(s) left, but requested ${requested}.`;
  }
  return `This plan allows ${limit} ${label}${limit === 1 ? '' : 's'} per month. You have ${remaining} ${label} slot(s) left, but requested ${requested}.`;
}

export async function listBorrows(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter: any = {};
    if (req.user.role !== 'ADMIN') filter.userId = req.user._id;
    const { status, returnRequested } = req.query;
    if (status) filter.status = status;
    if (returnRequested === 'true') filter.returnRequested = true;
    const borrows = await Borrow.find(filter)
      .populate('userId', 'name email')
      .populate('bookId', 'title coverImage kind author')
      .sort({ createdAt: -1 });
    res.json({ borrows });
  } catch (err) { next(err); }
}

export async function requestBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bookIds } = requestBooksSchema.parse(req.body);
    const uniqueBookIds = [...new Set(bookIds)];

    const membership = await Membership.findOne({
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

    const activeBorrowsCount = await Borrow.countDocuments({
      userId: req.user._id,
      cycleMonth,
      cycleYear,
      status: { $in: ['ACTIVE', 'RETURNED'] },
    });

    const books = await Book.find({ _id: { $in: uniqueBookIds } }).populate('categoryId', 'name slug iconEmoji');
    if (books.length !== uniqueBookIds.length) {
      const foundIds = new Set(books.map((book) => String(book._id)));
      const missingBookIds = uniqueBookIds.filter((id) => !foundIds.has(String(id)));
      return res.status(404).json({ message: 'One or more books were not found', missingBookIds });
    }

    const cycleBorrows = await Borrow.find({
      userId: req.user._id,
      cycleMonth,
      cycleYear,
      status: { $in: ['ACTIVE', 'RETURNED'] },
    }).populate('bookId', 'kind');

    const usedBooks = cycleBorrows.filter((borrow: any) => (borrow.bookId as any)?.kind !== 'puzzle').length;
    const usedPuzzles = cycleBorrows.filter((borrow: any) => (borrow.bookId as any)?.kind === 'puzzle').length;
    const requestedBooks = books.filter((book) => book.kind !== 'puzzle').length;
    const requestedPuzzles = books.filter((book) => book.kind === 'puzzle').length;

    const allowance = getMembershipAllowanceSummary(membership);
    if (
      typeof allowance.monthlyTotalLimit === 'number' &&
      activeBorrowsCount + uniqueBookIds.length > allowance.monthlyTotalLimit
    ) {
      return res.status(400).json({
        message: buildQuotaError('item', allowance.monthlyTotalLimit, uniqueBookIds.length, activeBorrowsCount),
      });
    }
    if (
      typeof allowance.monthlyBookLimit === 'number' &&
      usedBooks + requestedBooks > allowance.monthlyBookLimit
    ) {
      return res.status(400).json({
        message: buildQuotaError('book', allowance.monthlyBookLimit, requestedBooks, usedBooks),
      });
    }
    if (
      typeof allowance.monthlyPuzzleLimit === 'number' &&
      usedPuzzles + requestedPuzzles > allowance.monthlyPuzzleLimit
    ) {
      return res.status(400).json({
        message:
          allowance.monthlyPuzzleLimit === 0
            ? `${getPlanLabel(membership.plan)} does not include puzzle borrowing.`
            : buildQuotaError('puzzle', allowance.monthlyPuzzleLimit, requestedPuzzles, usedPuzzles),
      });
    }

    const activeBorrowCounts = await Borrow.aggregate([
      { $match: { bookId: { $in: books.map((book) => book._id) }, status: 'ACTIVE' } },
      { $group: { _id: '$bookId', count: { $sum: 1 } } },
    ]);

    const borrowCountMap = new Map(activeBorrowCounts.map((entry) => [entry._id.toString(), entry.count]));
    const invalidBook = books.find((book) => {
      const activeBorrowCount = borrowCountMap.get(book._id.toString()) || 0;
      return activeBorrowCount >= book.totalCopies || !isPlanAllowedForBook(membership.plan, book.planAccess, book.kind);
    });

    if (invalidBook) {
      return res.status(400).json({
        message: `"${invalidBook.title}" is not available for your plan or is currently unavailable`,
      });
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + BORROW_DURATION_DAYS);

    const borrows = await Borrow.create(
      books.map((book) => ({
        userId: req.user._id,
        bookId: book._id,
        issueDate,
        dueDate,
        cycleMonth,
        cycleYear,
      }))
    );

    await Notification.insertMany(
      books.map((book) => ({
        userId: req.user._id,
        type: 'BOOK_ASSIGNED' as const,
        message: `"${book.title}" has been added to your order. Due date: ${dueDate.toLocaleDateString()}.`,
      }))
    );

    // Order confirmation email (best-effort, non-blocking).
    if (req.user.email) {
      const items: EmailItem[] = books.map((book) => ({ title: book.title }));
      void emailService.orderPlaced(req.user.email, req.user.name, items, dueDate);
    }

    const populatedBorrows = await Borrow.find({ _id: { $in: borrows.map((borrow) => borrow._id) } })
      .populate('userId', 'name email')
      .populate('bookId', 'title coverImage kind');

    res.status(201).json({ borrows: populatedBorrows });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function requestReturn(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const now = new Date();

    // Any borrowed book can be sent back — early or once due — as long as it isn't already awaiting pickup.
    const borrows = await Borrow.find({
      userId: req.user._id,
      status: { $in: ['ACTIVE', 'OVERDUE'] },
      returnRequested: { $ne: true },
    }).populate('bookId', 'title');

    if (borrows.length === 0) {
      return res.status(400).json({ message: 'You have no books to return' });
    }

    await Borrow.updateMany(
      { _id: { $in: borrows.map((borrow) => borrow._id) } },
      { returnRequested: true, returnRequestedAt: now }
    );

    const titles = borrows.map((borrow) => `"${(borrow.bookId as any).title}"`).join(', ');

    // Confirm to the member.
    await Notification.create({
      userId: req.user._id,
      type: 'GENERAL',
      message: `Return pickup requested for ${borrows.length} book(s): ${titles}. Our delivery partner will collect them soon.`,
    });

    // Alert admins/delivery so the order can be picked up.
    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          userId: admin._id,
          type: 'GENERAL' as const,
          message: `${req.user.name} requested a return pickup for ${borrows.length} due book(s): ${titles}.`,
        }))
      );
    }

    // Pickup-requested confirmation email to the member.
    if (req.user.email) {
      const items: EmailItem[] = borrows.map((borrow) => ({ title: (borrow.bookId as any).title }));
      void emailService.returnRequested(req.user.email, req.user.name, items);
    }

    res.json({ message: `Return pickup requested for ${borrows.length} book(s)`, count: borrows.length });
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

    const book = await Book.findById(data.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    const cycleBorrows = await Borrow.find({
      userId: data.userId,
      cycleMonth,
      cycleYear,
      status: { $in: ['ACTIVE', 'RETURNED'] },
    }).populate('bookId', 'kind');
    const usedBooks = cycleBorrows.filter((borrow: any) => (borrow.bookId as any)?.kind !== 'puzzle').length;
    const usedPuzzles = cycleBorrows.filter((borrow: any) => (borrow.bookId as any)?.kind === 'puzzle').length;
    const allowance = getMembershipAllowanceSummary(membership);

    if (
      typeof allowance.monthlyTotalLimit === 'number' &&
      activeBorrowsCount + 1 > allowance.monthlyTotalLimit
    ) {
      return res.status(400).json({ message: 'Monthly item quota exhausted' });
    }
    if (
      book.kind !== 'puzzle' &&
      typeof allowance.monthlyBookLimit === 'number' &&
      usedBooks + 1 > allowance.monthlyBookLimit
    ) {
      return res.status(400).json({ message: 'Monthly book quota exhausted' });
    }
    if (
      book.kind === 'puzzle' &&
      typeof allowance.monthlyPuzzleLimit === 'number' &&
      usedPuzzles + 1 > allowance.monthlyPuzzleLimit
    ) {
      return res.status(400).json({
        message:
          allowance.monthlyPuzzleLimit === 0
            ? `${getPlanLabel(membership.plan)} does not include puzzle borrowing`
            : 'Monthly puzzle quota exhausted',
      });
    }

    const bookActiveBorrows = await Borrow.countDocuments({ bookId: data.bookId, status: 'ACTIVE' });
    if (bookActiveBorrows >= book.totalCopies) return res.status(400).json({ message: 'Book not available' });
    if (!isPlanAllowedForBook(membership.plan, book.planAccess, book.kind)) {
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

    await borrow.populate('bookId', 'title coverImage kind');
    await borrow.populate('userId', 'name email');

    // Book-assigned email to the member.
    const assignee = borrow.userId as any;
    if (assignee?.email) {
      void emailService.bookAssigned(assignee.email, assignee.name, book.title, dueDate);
    }

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
    borrow.returnRequested = false;
    borrow.deliveryStatus = 'COMPLETED';
    await borrow.save();
    await borrow.populate('bookId', 'title coverImage kind');
    await borrow.populate('userId', 'name email');

    const member = borrow.userId as any;
    const title = (borrow.bookId as any)?.title as string;

    // In-app + email confirmation that the return is logged.
    await Notification.create({
      userId: member._id,
      type: 'ORDER_RETURNED',
      message: `Return confirmed for "${title}". Thanks for reading!`,
    });
    if (member?.email) {
      void emailService.orderReturned(member.email, member.name, [{ title }]);
    }

    res.json({ borrow });
  } catch (err) { next(err); }
}

/**
 * Admin assigns a delivery/pickup partner to one or more borrows. All borrows
 * must belong to the same member; the member gets one combined email.
 */
export async function assignDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z
      .object({
        borrowIds: z.array(z.string().min(1)).min(1),
        type: z.enum(['DELIVERY', 'PICKUP']),
        personName: z.string().min(1),
        personPhone: z.string().optional(),
        eta: z.string().optional(),
      })
      .parse(req.body);

    const borrows = await Borrow.find({ _id: { $in: data.borrowIds } })
      .populate('userId', 'name email')
      .populate('bookId', 'title');

    if (borrows.length === 0) return res.status(404).json({ message: 'No matching borrows found' });

    const memberIds = new Set(borrows.map((b) => String((b.userId as any)._id)));
    if (memberIds.size > 1) {
      return res.status(400).json({ message: 'All selected borrows must belong to the same member' });
    }

    const now = new Date();
    await Borrow.updateMany(
      { _id: { $in: borrows.map((b) => b._id) } },
      {
        deliveryStatus: 'ASSIGNED',
        deliveryType: data.type,
        deliveryPersonName: data.personName,
        deliveryPersonPhone: data.personPhone,
        deliveryAssignedAt: now,
      }
    );

    const member = borrows[0].userId as any;
    const items: EmailItem[] = borrows.map((b) => ({ title: (b.bookId as any).title }));
    const verb = data.type === 'PICKUP' ? 'collect' : 'deliver';

    await Notification.create({
      userId: member._id,
      type: 'DELIVERY_ASSIGNED',
      message: `${data.personName}${data.personPhone ? ` (${data.personPhone})` : ''} has been assigned to ${verb} ${items.length} book(s).${data.eta ? ` ETA: ${data.eta}.` : ''}`,
    });

    if (member?.email) {
      void emailService.deliveryAssigned(member.email, member.name, {
        type: data.type,
        personName: data.personName,
        personPhone: data.personPhone,
        items,
        eta: data.eta,
      });
    }

    res.json({ message: `Delivery partner assigned for ${items.length} book(s)`, count: items.length });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
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
