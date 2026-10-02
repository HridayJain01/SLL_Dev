import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
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
import { renderPackingSlip } from '../lib/packingSlip.js';
import { whatsapp } from '../lib/whatsapp.js';
import { notifyBackInStock } from '../lib/stockAlerts.js';

const assignBorrowSchema = z.object({
  userId: z.string().min(1),
  bookIds: z.array(z.string().min(1)).min(1),
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

const markDeliveredSchema = borrowIdsSchema.extend({
  /** Also close the older bag this delivery swapped out. */
  collectSwap: z.boolean().optional(),
});

/**
 * A copy counts as unavailable for as long as it is not physically back with
 * the library — whatever stage of the journey it is at, and whether or not it
 * is late. Filtering on `status: 'ACTIVE'` alone used to release late copies
 * back into stock while the member still had them.
 */
export const OUT_OF_LIBRARY = { status: { $ne: 'RETURNED' as const } };

/**
 * A refusal the member should see as a 400 ("you're over quota", "that copy is
 * gone"), as opposed to a genuine fault. Thrown rather than returned because the
 * checks now run inside a transaction callback, which has to abort by throwing.
 */
class OrderRejected extends Error {
  constructor(message: string, public status = 400, public extra: Record<string, unknown> = {}) {
    super(message);
    this.name = 'OrderRejected';
  }
}

/** Same reference the member and admin screens show — see `orderRefFromId` on the client. */
function orderRefFromId(id: string) {
  return `#SL-${id.slice(-6).toUpperCase()}`;
}

/** Order-placed messages: email + WhatsApp to the member, email + packing slip PDF to every admin. */
async function notifyOrderPlaced(userId: unknown, orderRef: string, books: any[], plan: string) {
  try {
    const member = await User.findById(userId).select('name email phone addresses');
    if (!member) return;
    const items: EmailItem[] = books.map((book) => ({ title: book.title }));
    const address =
      (member.addresses.find((a) => a.isDefault) ?? member.addresses[0])?.line ?? null;

    if (member.email) void emailService.orderPlaced(member.email, member.name, items);
    void whatsapp.orderPlaced(member.phone, member.name, orderRef, items.length);

    const admins = await User.find({ role: 'ADMIN', status: 'ACTIVE' }).select('email');
    if (admins.length === 0) return;
    const slip = renderPackingSlip({
      orderRef,
      placedAt: new Date(),
      member: { name: member.name, email: member.email, phone: member.phone, address, plan: getPlanLabel(plan) },
      items: books.map((book) => ({
        title: book.title, kind: book.kind, author: book.author, shelfCode: book.shelfCode,
      })),
    });
    const order = { ref: orderRef, memberName: member.name, memberEmail: member.email, memberPhone: member.phone, address };
    for (const admin of admins) {
      if (admin.email) void emailService.adminOrderPlaced(admin.email, order, items, slip);
    }
  } catch (err) {
    console.error('[order] notifying order placed failed:', (err as Error).message);
  }
}

function dueDateFrom(deliveredAt: Date) {
  const due = new Date(deliveredAt);
  due.setDate(due.getDate() + BORROW_DURATION_DAYS);
  return due;
}

export function getMembershipAllowanceSummary(membership: any) {
  // A blank limit on a membership that has any limit set is deliberate (an
  // admin-edited plan with no cap of that kind). Only a membership with none
  // at all predates stored limits and borrows its plan's defaults.
  const stored = [membership.monthlyBookLimit, membership.monthlyPuzzleLimit, membership.monthlyTotalLimit];
  if (stored.some((v) => typeof v === 'number')) {
    return {
      monthlyBookLimit: membership.monthlyBookLimit ?? null,
      monthlyPuzzleLimit: membership.monthlyPuzzleLimit ?? null,
      monthlyTotalLimit: membership.monthlyTotalLimit ?? null,
    };
  }
  const { monthlyBookLimit, monthlyPuzzleLimit, monthlyTotalLimit } = getPlanAllowance(membership.plan);
  return { monthlyBookLimit, monthlyPuzzleLimit, monthlyTotalLimit };
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

function firstOfNextMonth(now: Date) {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/** "1 October" — the day the next monthly order opens. */
export function nextCycleStart(now: Date): string {
  return firstOfNextMonth(now).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
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
    if (req.user!.role !== 'ADMIN') filter.userId = req.user!._id;

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
      .populate('userId', 'name email phone addresses')
      .populate('bookId', 'title coverImage kind author shelfCode')
      .sort({ createdAt: -1 });
    if (limit > 0) query.limit(limit);

    const borrows = await query;
    res.json({ borrows });
  } catch (err) { next(err); }
}

/**
 * Places one order (a bag) for a member. Members go through the one-order-a-
 * month rule and their plan's quota; an admin placing an order on a member's
 * behalf skips both (`enforceQuota: false`). Stock, plan access, and a
 * deliverable address are checked either way — those are physical limits,
 * not policy.
 */
async function placeOrder(userId: unknown, bookIds: string[], { enforceQuota }: { enforceQuota: boolean }) {
  const uniqueBookIds = [...new Set(bookIds)];

  const membership = await Membership.findOne({
    userId,
    status: 'ACTIVE',
    endDate: { $gte: new Date() },
  });

  if (!membership) {
    throw new OrderRejected('An active membership is needed to place an order');
  }

  // Nothing can be delivered without somewhere to take it and someone to call.
  const contact = await User.findById(userId).select('phone addresses');
  if (!contact?.phone?.trim() || !contact.addresses.length) {
    throw new OrderRejected(
      'Add your mobile number and a delivery address in your profile before placing an order.'
    );
  }

  const now = new Date();
  const cycleMonth = now.getMonth() + 1;
  const cycleYear = now.getFullYear();

  const books = await Book.find({ _id: { $in: uniqueBookIds } }).populate('categoryId', 'name slug iconEmoji');
  if (books.length !== uniqueBookIds.length) {
    const foundIds = new Set(books.map((book) => String(book._id)));
    const missingBookIds = uniqueBookIds.filter((id) => !foundIds.has(String(id)));
    throw new OrderRejected('One or more books were not found', 404, { missingBookIds });
  }

  const allowance = getMembershipAllowanceSummary(membership);
  const requestedBooks = books.filter((book) => book.kind !== 'puzzle').length;
  const requestedPuzzles = books.filter((book) => book.kind === 'puzzle').length;

  /**
   * Both the quota check and the availability check read a count and then write
   * rows that change it. Run apart, two orders landing together each see the
   * pre-write count and both succeed — a member double-tapping Submit blows past
   * their monthly allowance, and two members ordering the last copy of a title
   * both get it, so the shelf and the database disagree with no way back but
   * manual repair.
   *
   * A transaction closes both: the reads take a snapshot, and a concurrent write
   * to the same rows makes the loser abort. `withTransaction` retries transient
   * aborts for us, so the loser re-reads the committed state and is then rejected
   * on the merits.
   *
   * Requires a replica set. Atlas is one; a bare standalone `mongod` is not and
   * will throw here rather than quietly racing.
   *
   * Everything inside must be safe to run twice, since a retry replays it. The
   * confirmation email is therefore sent after the commit, not in here.
   */
  const session = await mongoose.startSession();
  let borrows: any[] = [];
  let collecting = 0;
  const issueDate = new Date();

  try {
    await session.withTransaction(async () => {
      /**
       * Claim the contended documents first.
       *
       * A transaction on its own is not enough here. The reads below are a
       * consistent snapshot, but MongoDB only aborts a transaction that writes a
       * document some other transaction already wrote — and two concurrent orders
       * insert two *different* borrow rows, which collide with nothing. Both would
       * commit against the same stale count.
       *
       * Bumping `orderSeq` on the books (availability is per title) and on the
       * member (quota is per member) turns that phantom into a genuine write
       * conflict, so the second transaction aborts and `withTransaction` retries it
       * against committed state.
       */
      await Book.updateMany(
        { _id: { $in: books.map((book) => book._id) } },
        { $inc: { orderSeq: 1 } },
        { session }
      );
      await User.updateOne({ _id: userId }, { $inc: { orderSeq: 1 } }, { session });

      const cycleBorrows = enforceQuota
        ? await Borrow.find(cycleFilter(userId, cycleMonth, cycleYear))
            .populate('bookId', 'kind')
            .session(session)
        : [];

      // One order per month: whatever quota is left unused does not carry
      // over to a second order. Admin orders skip this and the quota below.
      if (cycleBorrows.length > 0) {
        throw new OrderRejected(
          `You've already placed your order for this month. You can order again from ${nextCycleStart(now)}.`
        );
      }

      const activeBorrowsCount = cycleBorrows.length;
      const usedBooks = cycleBorrows.filter((borrow: any) => (borrow.bookId as any)?.kind !== 'puzzle').length;
      const usedPuzzles = cycleBorrows.filter((borrow: any) => (borrow.bookId as any)?.kind === 'puzzle').length;

      if (
        enforceQuota &&
        typeof allowance.monthlyTotalLimit === 'number' &&
        activeBorrowsCount + uniqueBookIds.length > allowance.monthlyTotalLimit
      ) {
        throw new OrderRejected(
          buildQuotaError('item', allowance.monthlyTotalLimit, uniqueBookIds.length, activeBorrowsCount)
        );
      }
      if (
        enforceQuota &&
        typeof allowance.monthlyBookLimit === 'number' &&
        usedBooks + requestedBooks > allowance.monthlyBookLimit
      ) {
        throw new OrderRejected(
          buildQuotaError('book', allowance.monthlyBookLimit, requestedBooks, usedBooks)
        );
      }
      if (
        enforceQuota &&
        typeof allowance.monthlyPuzzleLimit === 'number' &&
        usedPuzzles + requestedPuzzles > allowance.monthlyPuzzleLimit
      ) {
        throw new OrderRejected(
          allowance.monthlyPuzzleLimit === 0
            ? `${getPlanLabel(membership.plan)} does not include puzzle borrowing.`
            : buildQuotaError('puzzle', allowance.monthlyPuzzleLimit, requestedPuzzles, usedPuzzles)
        );
      }

      const outCounts = await Borrow.aggregate([
        { $match: { bookId: { $in: books.map((book) => book._id) }, ...OUT_OF_LIBRARY } },
        { $group: { _id: '$bookId', count: { $sum: 1 } } },
      ]).session(session);

      const borrowCountMap = new Map(outCounts.map((entry) => [entry._id.toString(), entry.count]));
      const invalidBook = books.find((book) => {
        const outCount = borrowCountMap.get(book._id.toString()) || 0;
        return outCount >= book.totalCopies || !isPlanAllowedForBook(membership.plan, book.planAccess, book.kind);
      });

      if (invalidBook) {
        throw new OrderRejected(
          `"${invalidBook.title}" is not available for your plan or is currently unavailable`
        );
      }

      // One shared issueDate is what groups these rows into a single order.
      // No due date yet — the loan period starts when the box is handed over, not
      // when it is ordered, so days spent in transit do not come out of it.
      borrows = await Borrow.create(
        books.map((book) => ({
          userId,
          bookId: book._id,
          issueDate,
          cycleMonth,
          cycleYear,
          status: 'ACTIVE',
          fulfilment: 'PREPARING',
        })),
        { session, ordered: true }
      );

      // Every delivery is a swap: whatever the member is still holding goes
      // back with the partner who brings this bag. Books already asked for
      // but not yet collected ride along too; ones with a pickup partner
      // already assigned keep that arrangement.
      const swap = await Borrow.updateMany(
        { userId, status: 'ACTIVE', fulfilment: { $in: ['WITH_MEMBER', 'RETURN_REQUESTED'] } },
        { fulfilment: 'RETURN_REQUESTED', returnRequested: true, returnRequestedAt: issueDate, swapWith: issueDate },
        { session }
      );
      collecting = swap.modifiedCount;

      await Notification.insertMany(
        [
          ...books.map((book) => ({
            userId,
            type: 'BOOK_ASSIGNED' as const,
            message: `"${book.title}" has been added to your order. We'll confirm your return date once it's delivered.`,
          })),
          ...(collecting > 0
            ? [{
                userId,
                type: 'GENERAL' as const,
                message: `We'll collect the ${collecting} book(s) you have now when this order is delivered.`,
              }]
            : []),
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  // Confirmation to the member and a packing slip to the library (best-effort, non-blocking).
  void notifyOrderPlaced(userId, orderRefFromId(String(borrows[0]._id)), books, membership.plan);

  const populatedBorrows = await Borrow.find({ _id: { $in: borrows.map((borrow) => borrow._id) } })
    .populate('userId', 'name email')
    .populate('bookId', 'title coverImage kind');

  return { borrows: populatedBorrows, collecting };
}

function sendOrderError(err: unknown, res: Response, next: NextFunction) {
  if (err instanceof z.ZodError) {
    return res.status(400).json({ message: 'Validation error', errors: err.errors });
  }
  if (err instanceof OrderRejected) {
    return res.status(err.status).json({ message: err.message, ...err.extra });
  }
  next(err);
}

export async function requestBooks(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { bookIds } = requestBooksSchema.parse(req.body);
    res.status(201).json(await placeOrder(req.user!._id, bookIds, { enforceQuota: true }));
  } catch (err) {
    sendOrderError(err, res, next);
  }
}

const returnRequestSchema = z.object({
  /** Any borrow in the bag; the whole bag it belongs to goes back. */
  orderId: z.string().min(1),
});

/**
 * Member asks for one bag to be collected — early or on time. A bag is the
 * batch created by one checkout (shared `issueDate`), and it goes back whole:
 * there is no returning part of a bag.
 */
export async function requestReturn(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { orderId } = returnRequestSchema.parse(req.body);
    const now = new Date();

    const anchor = await Borrow.findOne({ _id: orderId, userId: req.user!._id });
    if (!anchor) return res.status(404).json({ message: 'Order not found' });

    // A pickup on its own is a trip with nothing to drop off. While the member
    // can still order next month, the bag goes back with that delivery instead;
    // only a membership ending before then gets a standalone collection. Admin
    // can still schedule one at any time from the circulation desk.
    const membership = await Membership.findOne({
      userId: req.user!._id,
      status: 'ACTIVE',
      endDate: { $gte: firstOfNextMonth(now) },
    });
    if (membership) {
      return res.status(400).json({
        message: `Pickups ride along with your next delivery. Place your next order from ${nextCycleStart(now)} and we'll collect this bag on the same trip.`,
      });
    }

    const bag = await Borrow.find({
      userId: req.user!._id,
      issueDate: anchor.issueDate,
      status: 'ACTIVE',
    }).populate('bookId', 'title');

    if (bag.some((borrow) => FULFILMENT_INBOUND.includes(borrow.fulfilment))) {
      return res.status(400).json({
        message: 'This bag has not been delivered yet, so there is nothing to collect.',
      });
    }
    const borrows = bag.filter((borrow) => borrow.fulfilment === 'WITH_MEMBER');
    if (borrows.length === 0) {
      return res.status(400).json({
        message: bag.length > 0 ? 'A pickup is already requested for this bag.' : 'This bag is already returned.',
      });
    }

    await Borrow.updateMany(
      { _id: { $in: borrows.map((borrow) => borrow._id) } },
      { fulfilment: 'RETURN_REQUESTED', returnRequested: true, returnRequestedAt: now }
    );

    const titles = borrows.map((borrow) => `"${(borrow.bookId as any).title}"`).join(', ');

    // Confirm to the member.
    await Notification.create({
      userId: req.user!._id,
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
          message: `${req.user!.name} requested a return pickup for ${borrows.length} book(s): ${titles}.`,
        }))
      );
    }

    // Pickup-requested confirmation email to the member.
    if (req.user!.email) {
      const items: EmailItem[] = borrows.map((borrow) => ({ title: (borrow.bookId as any).title }));
      void emailService.returnRequested(req.user!.email, req.user!.name, items);
    }

    res.json({ message: `Return pickup requested for ${borrows.length} book(s)`, count: borrows.length });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

/**
 * Admin places an order on a member's behalf. Same as a member's checkout —
 * one bag, swap pickup, confirmation, packing slip — but outside the monthly
 * quota and the one-order-a-month rule.
 */
export async function assignBook(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, bookIds } = assignBorrowSchema.parse(req.body);
    res.status(201).json(await placeOrder(userId, bookIds, { enforceQuota: false }));
  } catch (err) {
    sendOrderError(err, res, next);
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

/** The older books still waiting to go back with this batch's delivery. */
function swapFilter(memberId: unknown, batch: { issueDate: Date }[]) {
  return {
    userId: memberId,
    status: 'ACTIVE' as const,
    fulfilment: { $in: ['RETURN_REQUESTED', 'PICKUP_SCHEDULED'] },
    swapWith: { $in: [...new Set(batch.map((b) => b.issueDate.getTime()))].map((t) => new Date(t)) },
  };
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

    // The same partner collects the bag this order swaps out.
    const swap = await Borrow.updateMany(
      swapFilter(member._id, borrows!),
      {
        fulfilment: 'PICKUP_SCHEDULED',
        'pickup.partnerName': data.personName,
        'pickup.partnerPhone': data.personPhone,
        'pickup.eta': data.eta,
        'pickup.assignedAt': now,
      }
    );

    await Notification.create({
      userId: member._id,
      type: 'DELIVERY_ASSIGNED',
      message: `${data.personName}${data.personPhone ? ` (${data.personPhone})` : ''} is on the way with ${items.length} book(s).${data.eta ? ` ETA: ${data.eta}.` : ''}${swap.matchedCount > 0 ? ` Please keep your ${swap.matchedCount} current book(s) ready to hand back.` : ''}`,
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
    const data = markDeliveredSchema.parse(req.body);
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

    // The partner took the swapped-out bag on the same visit.
    let collected = 0;
    if (data.collectSwap) {
      const old = await Borrow.find(swapFilter(member._id, borrows!))
        .populate('userId', 'name email')
        .populate('bookId', 'title');
      if (old.length > 0) await closeBorrows(old);
      collected = old.length;
    }

    res.json({
      message: `${items.length} book(s) marked delivered${collected > 0 ? `, ${collected} collected` : ''}`,
      count: items.length,
      collected,
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
 * Closes the loans on books that are physically back: frees the copies, tells
 * the member, and alerts anyone waiting on those titles. Expects open rows,
 * populated with `userId` and `bookId`, all for one member.
 */
async function closeBorrows(open: any[]) {
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
  // Each returned copy is back on the shelf for whoever was waiting on it.
  await notifyBackInStock(open.map((b) => (b.bookId as any)?._id).filter(Boolean));
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

    await closeBorrows(open);

    const updated = await Borrow.find({ _id: { $in: open.map((b) => b._id) } })
      .populate('userId', 'name email')
      .populate('bookId', 'title coverImage kind');

    res.json({
      message: `${open.length} book(s) marked returned`,
      count: open.length,
      borrows: updated,
      borrow: updated[0],
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

const setStageSchema = z.object({
  borrowIds: z.array(z.string().min(1)).min(1),
  fulfilment: z.enum(['PREPARING', 'OUT_FOR_DELIVERY', 'WITH_MEMBER', 'RETURN_REQUESTED', 'PICKUP_SCHEDULED', 'COLLECTED']),
});

/**
 * Admin override: put these books at any stage, forwards or backwards, to
 * match what actually happened on the ground — a return handed over outside
 * the app, a delivery marked by mistake, a returned bag that never left.
 *
 * Moving to COLLECTED is a real return (same as Mark collected). Every other
 * move is a quiet correction: the member is not messaged, and the dates are
 * kept consistent with the stage — a book not yet delivered has no due date,
 * a delivered one always has one, and only a book on its way back keeps its
 * swap link.
 */
export async function setStage(req: Request, res: Response, next: NextFunction) {
  try {
    const { borrowIds, fulfilment } = setStageSchema.parse(req.body);
    const { borrows, error } = await loadBatch(borrowIds);
    if (error) return res.status(error.code).json({ message: error.message });

    if (fulfilment === 'COLLECTED') {
      const open = borrows!.filter((b) => b.status !== 'RETURNED');
      if (open.length === 0) {
        return res.status(400).json({ message: 'These books are already marked returned' });
      }
      await closeBorrows(open);
      return res.json({ message: `${open.length} book(s) marked returned`, count: open.length });
    }

    const now = new Date();
    const inbound = FULFILMENT_INBOUND.includes(fulfilment);
    const goingBack = fulfilment === 'RETURN_REQUESTED' || fulfilment === 'PICKUP_SCHEDULED';

    await Borrow.bulkWrite(
      borrows!.map((b) => {
        const $set: Record<string, unknown> = { fulfilment, status: 'ACTIVE', returnRequested: goingBack };
        const $unset: Record<string, 1> = { returnDate: 1, 'pickup.completedAt': 1 };
        if (inbound) {
          Object.assign($unset, { deliveredAt: 1, dueDate: 1, remindedAt: 1, 'delivery.completedAt': 1 });
        } else if (!b.deliveredAt) {
          Object.assign($set, { deliveredAt: now, dueDate: dueDateFrom(now), 'delivery.completedAt': now });
        }
        if (goingBack) {
          if (!b.returnRequestedAt) $set.returnRequestedAt = now;
        } else {
          Object.assign($unset, { returnRequestedAt: 1, swapWith: 1 });
        }
        return { updateOne: { filter: { _id: b._id }, update: { $set, $unset } } };
      })
    );

    const label = fulfilment.toLowerCase().replace(/_/g, ' ');
    res.json({ message: `${borrows!.length} book(s) moved to ${label}`, count: borrows!.length });
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
      .populate('userId', 'name email phone addresses')
      .populate('bookId', 'title coverImage shelfCode')
      .sort({ dueDate: 1 });
    res.json({ borrows });
  } catch (err) { next(err); }
}
