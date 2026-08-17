import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Borrow, {
  BorrowFulfilment,
  FULFILMENT_INBOUND,
  FULFILMENT_WITH_MEMBER,
} from '../models/Borrow.js';
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

const partnerSchema = z.object({
  borrowIds: z.array(z.string().min(1)).min(1),
  personName: z.string().min(1),
  personPhone: z.string().optional(),
  eta: z.string().optional(),
});

const borrowIdsSchema = z.object({
  borrowIds: z.array(z.string().min(1)).min(1),
});

/**
 * A copy counts as unavailable for as long as it is not physically back with
 * the library — whatever stage of the journey it is at, and whether or not it
 * is late. Filtering on `status: 'ACTIVE'` alone used to release late copies
 * back into stock while the member still had them.
 */
export const OUT_OF_LIBRARY = { status: { $ne: 'RETURNED' as const } };

function dueDateFrom(deliveredAt: Date) {
  const due = new Date(deliveredAt);
  due.setDate(due.getDate() + BORROW_DURATION_DAYS);
  return due;
}

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

/**
 * Everything the member ordered in this calendar cycle, whatever state it is
 * in. A borrow that is late, or still in transit, has still spent its slot —
 * excluding those is what previously let a member re-order against books they
 * were already holding.
 */
function cycleFilter(userId: unknown, cycleMonth: number, cycleYear: number) {
  return { userId, cycleMonth, cycleYear };
}

export async function listBorrows(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const filter: any = {};
    if (req.user.role !== 'ADMIN') filter.userId = req.user._id;

    const { status, fulfilment, returnRequested, overdue } = req.query;
    if (status) filter.status = status;
    if (fulfilment) {
      filter.fulfilment = typeof fulfilment === 'string' && fulfilment.includes(',')
        ? { $in: fulfilment.split(',') }
        : fulfilment;
    }
    if (returnRequested === 'true') filter.returnRequested = true;
    if (overdue === 'true') {
      filter.status = 'ACTIVE';
      filter.dueDate = { $ne: null, $lt: new Date() };
    }

    // Returned history is unbounded, so callers that want it pass a limit.
    const limit = Math.min(Number(req.query.limit) || 0, 1000);

    const query = Borrow.find(filter)
      .populate('userId', 'name email phone')
      .populate('bookId', 'title coverImage kind author shelfCode')
      .sort({ createdAt: -1 });
    if (limit > 0) query.limit(limit);

    const borrows = await query;
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

    const books = await Book.find({ _id: { $in: uniqueBookIds } }).populate('categoryId', 'name slug iconEmoji');
    if (books.length !== uniqueBookIds.length) {
      const foundIds = new Set(books.map((book) => String(book._id)));
      const missingBookIds = uniqueBookIds.filter((id) => !foundIds.has(String(id)));
      return res.status(404).json({ message: 'One or more books were not found', missingBookIds });
    }

    const cycleBorrows = await Borrow.find(
      cycleFilter(req.user._id, cycleMonth, cycleYear)
    ).populate('bookId', 'kind');

    const activeBorrowsCount = cycleBorrows.length;
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

    const outCounts = await Borrow.aggregate([
      { $match: { bookId: { $in: books.map((book) => book._id) }, ...OUT_OF_LIBRARY } },
      { $group: { _id: '$bookId', count: { $sum: 1 } } },
    ]);

    const borrowCountMap = new Map(outCounts.map((entry) => [entry._id.toString(), entry.count]));
    const invalidBook = books.find((book) => {
      const outCount = borrowCountMap.get(book._id.toString()) || 0;
      return outCount >= book.totalCopies || !isPlanAllowedForBook(membership.plan, book.planAccess, book.kind);
    });

    if (invalidBook) {
      return res.status(400).json({
        message: `"${invalidBook.title}" is not available for your plan or is currently unavailable`,
      });
    }

    // One shared issueDate is what groups these rows into a single order.
    const issueDate = new Date();

    // No due date yet — the loan period starts when the box is handed over, not
    // when it is ordered, so days spent in transit do not come out of it.
    const borrows = await Borrow.create(
      books.map((book) => ({
        userId: req.user._id,
        bookId: book._id,
        issueDate,
        cycleMonth,
        cycleYear,
        status: 'ACTIVE',
        fulfilment: 'PREPARING',
      }))
    );

    await Notification.insertMany(
      books.map((book) => ({
        userId: req.user._id,
        type: 'BOOK_ASSIGNED' as const,
        message: `"${book.title}" has been added to your order. We'll confirm your return date once it's delivered.`,
      }))
    );

    // Order confirmation email (best-effort, non-blocking).
    if (req.user.email) {
      const items: EmailItem[] = books.map((book) => ({ title: book.title }));
      void emailService.orderPlaced(req.user.email, req.user.name, items);
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

    // Whole-box returns: everything currently with the member goes back together.
    // Books still in transit are excluded — there is nothing to collect yet.
    const borrows = await Borrow.find({
      userId: req.user._id,
      status: 'ACTIVE',
      fulfilment: 'WITH_MEMBER',
    }).populate('bookId', 'title');

    if (borrows.length === 0) {
      const inTransit = await Borrow.countDocuments({
        userId: req.user._id,
        status: 'ACTIVE',
        fulfilment: { $in: FULFILMENT_INBOUND },
      });
      return res.status(400).json({
        message: inTransit > 0
          ? 'Your order has not been delivered yet, so there is nothing to collect.'
          : 'You have no books to return',
      });
    }

    await Borrow.updateMany(
      { _id: { $in: borrows.map((borrow) => borrow._id) } },
      { fulfilment: 'RETURN_REQUESTED', returnRequested: true, returnRequestedAt: now }
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
          message: `${req.user.name} requested a return pickup for ${borrows.length} book(s): ${titles}.`,
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

    const book = await Book.findById(data.bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const cycleBorrows = await Borrow.find(
      cycleFilter(data.userId, cycleMonth, cycleYear)
    ).populate('bookId', 'kind');

    const activeBorrowsCount = cycleBorrows.length;
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

    const copiesOut = await Borrow.countDocuments({ bookId: data.bookId, ...OUT_OF_LIBRARY });
    if (copiesOut >= book.totalCopies) return res.status(400).json({ message: 'Book not available' });
    if (!isPlanAllowedForBook(membership.plan, book.planAccess, book.kind)) {
      return res.status(400).json({ message: 'Book not available for your plan' });
    }

    const borrow = await Borrow.create({
      userId: data.userId,
      bookId: data.bookId,
      issueDate: new Date(),
      cycleMonth,
      cycleYear,
      status: 'ACTIVE',
      fulfilment: 'PREPARING',
    });

    await Notification.create({
      userId: data.userId, type: 'BOOK_ASSIGNED',
      message: `"${book.title}" has been assigned to you. We'll confirm your return date once it's delivered.`,
    });

    await borrow.populate('bookId', 'title coverImage kind');
    await borrow.populate('userId', 'name email');

    // Book-assigned email to the member.
    const assignee = borrow.userId as any;
    if (assignee?.email) {
      void emailService.bookAssigned(assignee.email, assignee.name, book.title);
    }

    res.status(201).json({ borrow });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

/**
 * Loads the borrows for a bulk admin action and refuses to act across members,
 * since every one of these actions sends that member a single combined message.
 */
async function loadBatch(borrowIds: string[]) {
  const borrows = await Borrow.find({ _id: { $in: borrowIds } })
    .populate('userId', 'name email')
    .populate('bookId', 'title');

  if (borrows.length === 0) return { error: { code: 404, message: 'No matching borrows found' } };

  const memberIds = new Set(borrows.map((b) => String((b.userId as any)._id)));
  if (memberIds.size > 1) {
    return { error: { code: 400, message: 'All selected borrows must belong to the same member' } };
  }
  return { borrows };
}

function rejectWrongState(
  borrows: { fulfilment: BorrowFulfilment; bookId: any }[],
  allowed: BorrowFulfilment[],
  action: string
) {
  const bad = borrows.find((b) => !allowed.includes(b.fulfilment));
  if (!bad) return null;
  return `"${bad.bookId?.title ?? 'This book'}" is ${bad.fulfilment.toLowerCase().replace(/_/g, ' ')} and cannot be ${action}.`;
}

/** Admin puts an order on a van. PREPARING → OUT_FOR_DELIVERY. */
export async function assignDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const data = partnerSchema.parse(req.body);
    const { borrows, error } = await loadBatch(data.borrowIds);
    if (error) return res.status(error.code).json({ message: error.message });

    const wrong = rejectWrongState(borrows!, ['PREPARING', 'OUT_FOR_DELIVERY'], 'sent out for delivery');
    if (wrong) return res.status(400).json({ message: wrong });

    const now = new Date();
    await Borrow.updateMany(
      { _id: { $in: borrows!.map((b) => b._id) } },
      {
        fulfilment: 'OUT_FOR_DELIVERY',
        'delivery.partnerName': data.personName,
        'delivery.partnerPhone': data.personPhone,
        'delivery.eta': data.eta,
        'delivery.assignedAt': now,
      }
    );

    const member = borrows![0].userId as any;
    const items: EmailItem[] = borrows!.map((b) => ({ title: (b.bookId as any).title }));

    await Notification.create({
      userId: member._id,
      type: 'DELIVERY_ASSIGNED',
      message: `${data.personName}${data.personPhone ? ` (${data.personPhone})` : ''} is on the way with ${items.length} book(s).${data.eta ? ` ETA: ${data.eta}.` : ''}`,
    });

    if (member?.email) {
      void emailService.deliveryAssigned(member.email, member.name, {
        type: 'DELIVERY',
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

/**
 * Admin confirms the box reached the member. This is the moment the loan
 * period starts — `dueDate` is written here and nowhere else.
 */
export async function markDelivered(req: Request, res: Response, next: NextFunction) {
  try {
    const data = borrowIdsSchema.parse(req.body);
    const { borrows, error } = await loadBatch(data.borrowIds);
    if (error) return res.status(error.code).json({ message: error.message });

    const wrong = rejectWrongState(borrows!, FULFILMENT_INBOUND, 'marked delivered');
    if (wrong) return res.status(400).json({ message: wrong });

    const deliveredAt = new Date();
    const dueDate = dueDateFrom(deliveredAt);

    await Borrow.updateMany(
      { _id: { $in: borrows!.map((b) => b._id) } },
      {
        fulfilment: 'WITH_MEMBER',
        deliveredAt,
        dueDate,
        'delivery.completedAt': deliveredAt,
      }
    );

    const member = borrows![0].userId as any;
    const items: EmailItem[] = borrows!.map((b) => ({ title: (b.bookId as any).title }));

    await Notification.create({
      userId: member._id,
      type: 'BOOK_ASSIGNED',
      message: `${items.length} book(s) delivered. Please return them by ${dueDate.toLocaleDateString()}.`,
    });

    if (member?.email) {
      void emailService.orderDelivered(member.email, member.name, items, dueDate);
    }

    res.json({
      message: `${items.length} book(s) marked delivered`,
      count: items.length,
      dueDate,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

/** Admin assigns someone to collect a requested return. RETURN_REQUESTED → PICKUP_SCHEDULED. */
export async function assignPickup(req: Request, res: Response, next: NextFunction) {
  try {
    const data = partnerSchema.parse(req.body);
    const { borrows, error } = await loadBatch(data.borrowIds);
    if (error) return res.status(error.code).json({ message: error.message });

    const wrong = rejectWrongState(
      borrows!,
      ['WITH_MEMBER', 'RETURN_REQUESTED', 'PICKUP_SCHEDULED'],
      'scheduled for pickup'
    );
    if (wrong) return res.status(400).json({ message: wrong });

    const now = new Date();
    await Borrow.updateMany(
      { _id: { $in: borrows!.map((b) => b._id) } },
      {
        fulfilment: 'PICKUP_SCHEDULED',
        returnRequested: true,
        'pickup.partnerName': data.personName,
        'pickup.partnerPhone': data.personPhone,
        'pickup.eta': data.eta,
        'pickup.assignedAt': now,
      }
    );

    const member = borrows![0].userId as any;
    const items: EmailItem[] = borrows!.map((b) => ({ title: (b.bookId as any).title }));

    await Notification.create({
      userId: member._id,
      type: 'DELIVERY_ASSIGNED',
      message: `${data.personName}${data.personPhone ? ` (${data.personPhone})` : ''} will collect ${items.length} book(s).${data.eta ? ` ETA: ${data.eta}.` : ''}`,
    });

    if (member?.email) {
      void emailService.deliveryAssigned(member.email, member.name, {
        type: 'PICKUP',
        personName: data.personName,
        personPhone: data.personPhone,
        items,
        eta: data.eta,
      });
    }

    res.json({ message: `Pickup partner assigned for ${items.length} book(s)`, count: items.length });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

/**
 * The books are physically back. This is the only place that frees the copy and
 * closes the loan. Already-returned rows are skipped rather than re-closed, so
 * the return date and the confirmation email are never rewritten.
 */
export async function markCollected(req: Request, res: Response, next: NextFunction) {
  try {
    const borrowIds = req.params.id ? [req.params.id] : borrowIdsSchema.parse(req.body).borrowIds;
    const { borrows, error } = await loadBatch(borrowIds);
    if (error) return res.status(error.code).json({ message: error.message });

    const open = borrows!.filter((b) => b.status !== 'RETURNED');
    if (open.length === 0) {
      return res.status(400).json({ message: 'These books are already marked returned' });
    }

    const returnDate = new Date();
    await Borrow.updateMany(
      { _id: { $in: open.map((b) => b._id) } },
      {
        status: 'RETURNED',
        fulfilment: 'COLLECTED',
        returnDate,
        returnRequested: false,
        'pickup.completedAt': returnDate,
      }
    );

    const member = open[0].userId as any;
    const items: EmailItem[] = open.map((b) => ({ title: (b.bookId as any).title }));

    await Notification.create({
      userId: member._id,
      type: 'ORDER_RETURNED',
      message: `Return confirmed for ${items.length} book(s). Thanks for reading!`,
    });
    if (member?.email) {
      void emailService.orderReturned(member.email, member.name, items);
    }

    const updated = await Borrow.find({ _id: { $in: open.map((b) => b._id) } })
      .populate('userId', 'name email')
      .populate('bookId', 'title coverImage kind');

    res.json({
      message: `${items.length} book(s) marked returned`,
      count: items.length,
      borrows: updated,
      borrow: updated[0],
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

/**
 * Read-only. The previous version flipped the rows it found to an OVERDUE
 * status, which meant they no longer matched its own query and the list came
 * back empty on the second load. Lateness is derived from `dueDate` instead, so
 * this can be called as often as you like.
 */
export async function listOverdue(_req: Request, res: Response, next: NextFunction) {
  try {
    const borrows = await Borrow.find({
      status: 'ACTIVE',
      fulfilment: { $in: FULFILMENT_WITH_MEMBER },
      dueDate: { $ne: null, $lt: new Date() },
    })
      .populate('userId', 'name email phone')
      .populate('bookId', 'title coverImage shelfCode')
      .sort({ dueDate: 1 });
    res.json({ borrows });
  } catch (err) { next(err); }
}
