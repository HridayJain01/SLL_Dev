import { IBook, IBorrow } from '@/types';

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
  dueDate: Date;
  items: IBorrow[];
  status: OrderStatus;
  /** False once every book in the order is back with the library. */
  isCurrent: boolean;
  returnRequested: boolean;
  deliveryType?: 'DELIVERY' | 'PICKUP';
  deliveryPersonName?: string;
  deliveryPersonPhone?: string;
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

/**
 * The server only flips ACTIVE → OVERDUE when an admin opens the overdue list,
 * so the member-facing screens compare due dates themselves.
 */
export function isOverdue(borrow: IBorrow): boolean {
  if (borrow.status === 'RETURNED') return false;
  if (borrow.status === 'OVERDUE') return true;
  return new Date(borrow.dueDate).getTime() < Date.now();
}

export function orderRefFromId(id: string): string {
  return `#SL-${id.slice(-6).toUpperCase()}`;
}

function deriveStatus(items: IBorrow[]): OrderStatus {
  if (items.every((item) => item.status === 'RETURNED')) return 'COMPLETED';
  if (items.some(isOverdue)) return 'OVERDUE';

  const open = items.filter((item) => item.status !== 'RETURNED');
  if (open.some((item) => item.deliveryStatus === 'ASSIGNED' && item.deliveryType === 'PICKUP')) {
    return 'PICKUP_SCHEDULED';
  }
  if (open.some((item) => item.returnRequested)) return 'PICKUP_REQUESTED';
  if (open.some((item) => item.deliveryStatus === 'ASSIGNED')) return 'OUT_FOR_DELIVERY';
  if (open.every((item) => item.deliveryStatus === 'UNASSIGNED')) return 'PROCESSING';
  return 'WITH_YOU';
}

/** Newest order first. */
export function groupBorrowsIntoOrders(borrows: IBorrow[]): Order[] {
  const groups = new Map<string, IBorrow[]>();

  for (const borrow of borrows) {
    const key = String(new Date(borrow.issueDate).getTime());
    const group = groups.get(key);
    if (group) group.push(borrow);
    else groups.set(key, [borrow]);
  }

  return [...groups.values()]
    .map((items) => {
      const status = deriveStatus(items);
      const assigned = items.find((item) => item.deliveryStatus === 'ASSIGNED');
      return {
        id: items[0]._id,
        ref: orderRefFromId(items[0]._id),
        placedAt: new Date(items[0].issueDate),
        dueDate: new Date(items[0].dueDate),
        items,
        status,
        isCurrent: status !== 'COMPLETED',
        returnRequested: items.some((item) => item.returnRequested && item.status !== 'RETURNED'),
        deliveryType: assigned?.deliveryType,
        deliveryPersonName: assigned?.deliveryPersonName,
        deliveryPersonPhone: assigned?.deliveryPersonPhone,
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
