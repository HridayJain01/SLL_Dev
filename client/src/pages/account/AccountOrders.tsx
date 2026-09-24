import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CalendarClock, ClipboardList, Truck } from 'lucide-react';
import api from '@/lib/axios';
import { IBorrow } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  bookOf,
  formatDate,
  FULFILMENT_LABEL,
  groupBorrowsIntoOrders,
  daysUntilDue,
  isOverdue,
  Order,
  ORDER_STATUS_META,
} from '@/lib/orders';
import { cn } from '@/lib/utils';
import {
  AccountButton,
  AccountPage,
  AccountEmptyState,
  AccountPageHeader,
  Card,
} from '@/components/account/AccountCard';

type Tab = 'CURRENT' | 'PAST';

/**
 * Order history — Figma sidebar entry "Order History". Each order is a bag: the
 * batch of borrows created together by checkout. A bag shows its return date and
 * goes back whole — early or on time — via `POST /borrows/return-request`.
 */
export default function AccountOrders() {
  const [tab, setTab] = useState<Tab>('CURRENT');
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: borrows, isLoading } = useQuery({
    queryKey: ['borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
    enabled: !!user,
  });

  const orders = useMemo(() => groupBorrowsIntoOrders(borrows ?? []), [borrows]);
  const visibleOrders = orders.filter((order) => (tab === 'CURRENT' ? order.isCurrent : !order.isCurrent));

  const requestReturn = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post('/borrows/return-request', { orderId });
      return res.data as { count: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(
        `Pickup requested for your bag of ${result.count}. Our delivery partner will collect it soon.`
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not request a return pickup');
    },
  });

  return (
    <AccountPage>
      <AccountPageHeader
        title="Order History"
        subtitle="Every bag you've received, when it's due back, and what's with you right now."
      />

      {/* Tabs */}
      <div className="inline-flex rounded-full border border-[#e5e7eb] bg-white p-[4px]">
        {(
          [
            ['CURRENT', `Current (${orders.filter((o) => o.isCurrent).length})`],
            ['PAST', `Past (${orders.filter((o) => !o.isCurrent).length})`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              'rounded-full px-[18px] py-[8px] font-body text-[14px] font-semibold leading-[20px] transition-colors',
              tab === value ? 'bg-chip-blush text-primary' : 'text-[#9ca3af] hover:text-night'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="font-body text-[14px] text-slate-muted">Loading your orders…</p>
      ) : visibleOrders.length === 0 ? (
        <AccountEmptyState
          icon={<ClipboardList className="h-[22px] w-[22px]" strokeWidth={1.5} />}
          title={tab === 'CURRENT' ? 'No active orders' : 'No past orders yet'}
          body={
            tab === 'CURRENT'
              ? 'Fill your box and check out to place your first order.'
              : 'Once books are returned, the order moves here.'
          }
          action={
            tab === 'CURRENT' ? (
              <Link
                to="/account/box"
                className="mt-[6px] rounded-full bg-lagoon-deep px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-lagoon-darkest"
              >
                Go to my box
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-[16px]">
          {visibleOrders.map((order) => {
            const meta = ORDER_STATUS_META[order.status];
            return (
              <Card key={order.id} className="p-[24px]">
                {/* Order header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#f3f4f6] pb-[16px]">
                  <div>
                    <p className="font-heading text-[16px] font-bold leading-[24px] text-night">
                      Order {order.ref}
                    </p>
                    <p className="pt-[2px] font-body text-[13px] leading-[20px] text-slate-muted">
                      Placed {formatDate(order.placedAt)} · {order.items.length} item
                      {order.items.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-[8px]">
                    <span
                      className={`rounded-full px-[12px] py-[4px] font-body text-[12px] font-semibold leading-[16px] ${meta.className}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>

                {order.isCurrent && (
                  <ReturnPanel
                    order={order}
                    pending={requestReturn.isPending && requestReturn.variables === order.id}
                    onReturn={() => requestReturn.mutate(order.id)}
                  />
                )}

                {/* Both legs are kept separately, so the person who brought the
                    box is still on record after a pickup partner is assigned. */}
                {(order.delivery?.partnerName || order.pickup?.partnerName) && (
                  <div className="space-y-[4px] pt-[14px]">
                    {order.delivery?.partnerName && (
                      <p className="font-body text-[13px] leading-[20px] text-slate-muted">
                        Delivered by{' '}
                        <span className="font-semibold text-night">{order.delivery.partnerName}</span>
                        {order.delivery.partnerPhone && ` · ${order.delivery.partnerPhone}`}
                        {order.deliveredAt && ` · ${formatDate(order.deliveredAt)}`}
                      </p>
                    )}
                    {order.pickup?.partnerName && (
                      <p className="font-body text-[13px] leading-[20px] text-slate-muted">
                        {order.pickup.completedAt ? 'Collected by' : 'Pickup partner:'}{' '}
                        <span className="font-semibold text-night">{order.pickup.partnerName}</span>
                        {order.pickup.partnerPhone && ` · ${order.pickup.partnerPhone}`}
                        {order.pickup.eta && !order.pickup.completedAt && ` · ETA ${order.pickup.eta}`}
                      </p>
                    )}
                  </div>
                )}

                {/* Items */}
                <ul className="divide-y divide-[#f3f4f6]">
                  {order.items.map((item) => {
                    const book = bookOf(item);
                    const overdue = isOverdue(item);
                    return (
                      <li key={item._id} className="flex items-center gap-[14px] py-[14px]">
                        <img
                          src={
                            book?.coverImage ||
                            `https://placehold.co/100x150?text=${encodeURIComponent(
                              book?.title ?? 'Book'
                            )}`
                          }
                          alt=""
                          loading="lazy"
                          className="h-[64px] w-[48px] shrink-0 rounded-[8px] object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          {book ? (
                            <Link
                              to={`/library/${book._id}`}
                              className="block truncate font-body text-[14px] font-semibold leading-[20px] text-night hover:text-lagoon-deep"
                            >
                              {book.title}
                            </Link>
                          ) : (
                            <span className="font-body text-[14px] font-semibold text-night">
                              Untitled
                            </span>
                          )}
                          <p className="pt-[2px] font-body text-[12px] leading-[16px] text-slate-muted">
                            {book?.kind === 'puzzle' ? 'Puzzle' : 'Book'}
                            {book?.author ? ` · ${book.author}` : ''}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {item.status === 'RETURNED' ? (
                            <p className="font-body text-[12px] leading-[16px] text-slate-muted">
                              Returned {item.returnDate ? formatDate(item.returnDate) : ''}
                            </p>
                          ) : item.dueDate ? (
                            <p
                              className={`font-body text-[12px] leading-[16px] ${
                                overdue ? 'font-semibold text-[#b91c1c]' : 'text-slate-muted'
                              }`}
                            >
                              {overdue ? 'Overdue since ' : 'Due '}
                              {formatDate(item.dueDate)}
                            </p>
                          ) : (
                            <p className="font-body text-[12px] leading-[16px] text-slate-muted">
                              Not delivered yet
                            </p>
                          )}
                          {item.status !== 'RETURNED' && (
                            <p className="pt-[2px] font-body text-[11px] font-semibold leading-[16px] text-primary">
                              {FULFILMENT_LABEL[item.fulfilment]}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
    </AccountPage>
  );
}

/**
 * The bag's return date and its one action. The whole bag goes back together,
 * so there is a single button per bag and none per book.
 */
function ReturnPanel({ order, pending, onReturn }: { order: Order; pending: boolean; onReturn: () => void }) {
  const inTransit = order.items.some(
    (item) => item.fulfilment === 'PREPARING' || item.fulfilment === 'OUT_FOR_DELIVERY'
  );
  const returnable = !inTransit && order.items.some((item) => item.fulfilment === 'WITH_MEMBER');
  const daysLeft = daysUntilDue(order.dueDate);

  let headline: string;
  let detail: string;
  if (inTransit || !order.dueDate) {
    headline = 'Return date is set on delivery';
    detail = 'You get the full loan period from the day this bag reaches you.';
  } else if (daysLeft !== null && daysLeft < 0) {
    headline = `Overdue since ${formatDate(order.dueDate)}`;
    detail = 'Please request a pickup so we can collect the bag.';
  } else {
    headline = `Return by ${formatDate(order.dueDate)}`;
    detail =
      daysLeft === 0
        ? 'Due today.'
        : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left. Finished early? Send the whole bag back any time.`;
  }
  if (order.returnRequested && !returnable) {
    detail = order.pickup?.partnerName
      ? `${order.pickup.partnerName} will collect the whole bag${order.pickup.eta ? ` · ETA ${order.pickup.eta}` : ''}.`
      : "Pickup requested — we'll collect the whole bag soon.";
  }

  const overdue = order.status === 'OVERDUE';
  return (
    <div
      className={cn(
        'mt-[16px] flex flex-wrap items-center justify-between gap-3 rounded-[14px] px-[16px] py-[14px]',
        overdue ? 'bg-[#fee2e2]' : 'bg-[#f6f8f7]'
      )}
    >
      <div className="flex min-w-0 items-center gap-[12px]">
        <CalendarClock
          className={cn('h-[22px] w-[22px] shrink-0', overdue ? 'text-[#b91c1c]' : 'text-lagoon-deep')}
          strokeWidth={1.6}
        />
        <div className="min-w-0">
          <p className={cn('font-heading text-[15px] font-bold leading-[22px]', overdue ? 'text-[#b91c1c]' : 'text-night')}>
            {headline}
          </p>
          <p className="font-body text-[13px] leading-[20px] text-slate-muted">{detail}</p>
        </div>
      </div>
      {returnable && (
        <AccountButton onClick={onReturn} disabled={pending}>
          <span className="flex items-center gap-[8px]">
            <Truck className="h-[16px] w-[16px]" strokeWidth={1.6} />
            {pending ? 'Requesting…' : daysLeft !== null && daysLeft > 0 ? 'Return bag early' : 'Request pickup'}
          </span>
        </AccountButton>
      )}
    </div>
  );
}
