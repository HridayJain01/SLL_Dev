import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ClipboardList, Truck } from 'lucide-react';
import api from '@/lib/axios';
import { IBorrow } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { bookOf, formatDate, groupBorrowsIntoOrders, isOverdue, ORDER_STATUS_META } from '@/lib/orders';
import { cn } from '@/lib/utils';
import {
  AccountButton,
  AccountEmptyState,
  AccountPageHeader,
  Card,
} from '@/components/account/AccountCard';

type Tab = 'CURRENT' | 'PAST';

/**
 * Order history — Figma sidebar entry "Order History". Orders are the batches
 * of borrows created together by checkout; the return pickup request covers
 * every book currently out, which is what `POST /borrows/return-request` does.
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

  // Any book that's out can go back — early or once due — unless a pickup is
  // already booked for it.
  const returnableCount = (borrows ?? []).filter(
    (borrow) => borrow.status !== 'RETURNED' && !borrow.returnRequested
  ).length;

  const requestReturn = useMutation({
    mutationFn: async () => {
      const res = await api.post('/borrows/return-request');
      return res.data as { count: number };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(
        `Pickup requested for ${result.count} book(s). Our delivery partner will collect them soon.`
      );
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not request a return pickup');
    },
  });

  return (
    <div className="bg-white px-4 pb-[80px] pt-[64px] sm:px-[40px]">
      <div className="max-w-[987px] space-y-[20px]">
        <AccountPageHeader
          title="Order History"
          subtitle="Every box you've received, and what's with you right now."
          action={
            <AccountButton
              onClick={() => requestReturn.mutate()}
              disabled={returnableCount === 0 || requestReturn.isPending}
            >
              <span className="flex items-center gap-[8px]">
                <Truck className="h-[16px] w-[16px]" strokeWidth={1.6} />
                {requestReturn.isPending
                  ? 'Requesting…'
                  : `Request return pickup${returnableCount > 0 ? ` (${returnableCount})` : ''}`}
              </span>
            </AccountButton>
          }
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
                ? 'Build a box from the library and check out to place your first order.'
                : 'Once books are returned, the order moves here.'
            }
            action={
              tab === 'CURRENT' ? (
                <Link
                  to="/library"
                  className="mt-[6px] rounded-full bg-lagoon-deep px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-lagoon-darkest"
                >
                  Browse the library
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
                        {order.isCurrent && ` · due ${formatDate(order.dueDate)}`}
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

                  {/* Delivery partner */}
                  {order.deliveryPersonName && (
                    <p className="pt-[14px] font-body text-[13px] leading-[20px] text-slate-muted">
                      {order.deliveryType === 'PICKUP' ? 'Pickup' : 'Delivery'} partner:{' '}
                      <span className="font-semibold text-night">{order.deliveryPersonName}</span>
                      {order.deliveryPersonPhone && ` · ${order.deliveryPersonPhone}`}
                    </p>
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
                            ) : (
                              <p
                                className={`font-body text-[12px] leading-[16px] ${
                                  overdue ? 'font-semibold text-[#b91c1c]' : 'text-slate-muted'
                                }`}
                              >
                                {overdue ? 'Overdue since ' : 'Due '}
                                {formatDate(item.dueDate)}
                              </p>
                            )}
                            {item.returnRequested && item.status !== 'RETURNED' && (
                              <p className="pt-[2px] font-body text-[11px] font-semibold leading-[16px] text-primary">
                                Pickup requested
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
      </div>
    </div>
  );
}
