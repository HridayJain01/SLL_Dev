import { IBook, IBorrow, IBorrowLeg, IUser } from '@/types';

/**
 * There is no separate Order collection on the server — an order is the batch
 * of borrows created together by `POST /borrows/request`, which all share one
 * `issueDate`. These helpers rebuild that grouping for the account screens.
 */

export const DELIVERY_MIN_BUSINESS_DAYS = 3;
export const DELIVERY_MAX_BUSINESS_DAYS = 5;

export type OrderStatus =
  | 'PROCESSING'
  | 'OUT_FOR_DELIVERY'
  | 'WITH_YOU'
  | 'PICKUP_REQUESTED'
  | 'PICKUP_SCHEDULED'
  | 'OVERDUE'
  | 'COMPLETED';

export type Order = {
  /** The first borrow's id — stable, and what the order reference is built from. */
  id: string;
  ref: string;
  placedAt: Date;
  /** Null until the order has been delivered — that is when the clock starts. */
  dueDate: Date | null;
  deliveredAt: Date | null;
  items: IBorrow[];
  status: OrderStatus;
  /** False once every book in the order is back with the library. */
  isCurrent: boolean;
  returnRequested: boolean;
  /** The partner bringing the box out, once one is assigned. */
  delivery?: IBorrowLeg;
  /** The partner collecting it, once one is assigned. */
  pickup?: IBorrowLeg;
};

export const ORDER_STATUS_META: Record<OrderStatus, { label: string; className: string }> = {
  PROCESSING: { label: 'Processing', className: 'bg-[#fef3c7] text-[#92400e]' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery', className: 'bg-[#dff7ff] text-[#0f6f8f]' },
  WITH_YOU: { label: 'With you', className: 'bg-[#d6f5ee] text-lagoon-darkest' },
  PICKUP_REQUESTED: { label: 'Pickup requested', className: 'bg-[#fde8e2] text-[#9a3412]' },
  PICKUP_SCHEDULED: { label: 'Pickup scheduled', className: 'bg-[#e4e6ff] text-[#3730a3]' },
  OVERDUE: { label: 'Overdue', className: 'bg-[#fee2e2] text-[#b91c1c]' },
  COMPLETED: { label: 'Returned', className: 'bg-[#f3f4f6] text-[#4b5563]' },
};

/** `bookId` is populated on every borrow the API returns to a member. */
export function bookOf(borrow: IBorrow): IBook | null {
  return typeof borrow.bookId === 'object' && borrow.bookId ? (borrow.bookId as IBook) : null;
}

/** `userId` is populated for admin queries, and a bare id for a member's own. */
export function memberOf(borrow: IBorrow): IUser | null {
  return typeof borrow.userId === 'object' && borrow.userId ? (borrow.userId as IUser) : null;
}

function memberIdOf(borrow: IBorrow): string {
  return memberOf(borrow)?._id ?? String(borrow.userId);
}

/**
 * Overdue is derived, never stored — on the server too. A book with no due date
 * has not been delivered yet, so it cannot be late.
 */
export function isOverdue(borrow: IBorrow): boolean {
  if (borrow.status === 'RETURNED') return false;
  if (!borrow.dueDate) return false;
  return new Date(borrow.dueDate).getTime() < Date.now();
}

/**
 * Whole days between now and the due date. Negative once it is late, null while
 * the order has not been delivered and so has no clock running yet.
 *
 * Rounded up, so "due tomorrow" stays 1 for the whole of today rather than
 * flipping to 0 halfway through the afternoon.
 */
export function daysUntilDue(dueDate: Date | string | null | undefined): number | null {
  if (!dueDate) return null;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
}

/** Where the box goes: the member's default saved address, else the first one. */
export function addressOf(user: IUser | null): string | null {
  const addresses = user?.addresses;
  if (!addresses?.length) return null;
  const chosen = addresses.find((a) => a.isDefault) ?? addresses[0];
  return chosen.line || null;
}

/** Human label for a single item's stage, used in the order rows. */
export const FULFILMENT_LABEL: Record<IBorrow['fulfilment'], string> = {
  PREPARING: 'Being packed',
  OUT_FOR_DELIVERY: 'On the way',
  WITH_MEMBER: 'With you',
  RETURN_REQUESTED: 'Pickup requested',
  PICKUP_SCHEDULED: 'Pickup scheduled',
  COLLECTED: 'Returned',
};

export function orderRefFromId(id: string): string {
  return `#SL-${id.slice(-6).toUpperCase()}`;
}

/**
 * The order takes the state of the item furthest along a problem — overdue
 * beats everything, then the return leg, then the outbound leg.
 */
function deriveStatus(items: IBorrow[]): OrderStatus {
  if (items.every((item) => item.status === 'RETURNED')) return 'COMPLETED';
  if (items.some(isOverdue)) return 'OVERDUE';

  const open = items.filter((item) => item.status !== 'RETURNED');
  if (open.some((item) => item.fulfilment === 'PICKUP_SCHEDULED')) return 'PICKUP_SCHEDULED';
  if (open.some((item) => item.fulfilment === 'RETURN_REQUESTED')) return 'PICKUP_REQUESTED';
  if (open.some((item) => item.fulfilment === 'OUT_FOR_DELIVERY')) return 'OUT_FOR_DELIVERY';
  if (open.every((item) => item.fulfilment === 'PREPARING')) return 'PROCESSING';
  return 'WITH_YOU';
}

/**
 * Newest order first.
 *
 * Keyed on member *and* issue time: for a member's own list the member is
 * constant so this is the plain checkout batch, but on the admin screens two
 * people checking out in the same millisecond must not merge into one order.
 */
export function groupBorrowsIntoOrders(borrows: IBorrow[]): Order[] {
  const groups = new Map<string, IBorrow[]>();

  for (const borrow of borrows) {
    const key = `${memberIdOf(borrow)}:${new Date(borrow.issueDate).getTime()}`;
    const group = groups.get(key);
    if (group) group.push(borrow);
    else groups.set(key, [borrow]);
  }

  return [...groups.values()]
    .map((items) => {
      const status = deriveStatus(items);
      // Items in one order move together, so the first one carrying a partner
      // or a due date speaks for the batch.
      const delivery = items.find((item) => item.delivery?.partnerName)?.delivery;
      const pickup = items.find((item) => item.pickup?.partnerName)?.pickup;
      const dueDate = items.find((item) => item.dueDate)?.dueDate;
      const deliveredAt = items.find((item) => item.deliveredAt)?.deliveredAt;

      return {
        id: items[0]._id,
        ref: orderRefFromId(items[0]._id),
        placedAt: new Date(items[0].issueDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        deliveredAt: deliveredAt ? new Date(deliveredAt) : null,
        items,
        status,
        isCurrent: status !== 'COMPLETED',
        returnRequested: items.some((item) => item.returnRequested && item.status !== 'RETURNED'),
        delivery,
        pickup,
      } satisfies Order;
    })
    .sort((a, b) => b.placedAt.getTime() - a.placedAt.getTime());
}

export function addBusinessDays(from: Date, days: number): Date {
  const date = new Date(from);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const weekday = date.getDay();
    if (weekday !== 0 && weekday !== 6) added += 1;
  }
  return date;
}

/** "July 25 to July 29, 2026" — the phrasing used on the confirmation screen. */
export function formatDeliveryWindow(from: Date | string): string {
  const start = addBusinessDays(new Date(from), DELIVERY_MIN_BUSINESS_DAYS);
  const end = addBusinessDays(new Date(from), DELIVERY_MAX_BUSINESS_DAYS);
  const dayAndMonth = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${dayAndMonth(start)} to ${dayAndMonth(end)}, ${end.getFullYear()}`;
}

export function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
