import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, BookOpen, Package, Sparkles, Wand2 } from 'lucide-react';
import api from '@/lib/axios';
import { IBook, IBorrow, IMembership, INotification } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useBookBasketStore } from '@/store/bookBasketStore';
import { getMembershipAllowance, isMembershipActive } from '@/lib/plans';
import { bookOf, formatDate, groupBorrowsIntoOrders, isOverdue, ORDER_STATUS_META } from '@/lib/orders';
import { Card, CardTitle, AccountPageHeader } from '@/components/account/AccountCard';

/**
 * Account overview — the landing screen of the member dashboard. Carries the
 * membership quota, the live order, recent notifications and recommendations
 * that used to live on /dashboard.
 */
export default function AccountOverview() {
  const user = useAuthStore((s) => s.user);
  const boxCount = useBookBasketStore((s) => s.selectedBooks.length);

  const { data: membership } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership | null;
    },
    enabled: !!user,
  });

  const { data: borrows, isLoading } = useQuery({
    queryKey: ['borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/me');
      return res.data.notifications as INotification[];
    },
    enabled: !!user,
  });

  const { data: recommended } = useQuery({
    queryKey: ['books', 'recommended'],
    queryFn: async () => {
      const res = await api.get('/books/recommended', { params: { limit: 6 } });
      return res.data as { books: IBook[]; basis: 'history' | 'newest' };
    },
    enabled: !!user,
  });

  const activeMember = isMembershipActive(membership);
  const allowance = getMembershipAllowance(activeMember ? membership : null);
  const orders = groupBorrowsIntoOrders(borrows ?? []);
  const currentOrders = orders.filter((order) => order.isCurrent);

  const now = new Date();
  const cycleBorrows = (borrows ?? []).filter(
    (borrow) =>
      borrow.cycleMonth === now.getMonth() + 1 &&
      borrow.cycleYear === now.getFullYear() &&
      (borrow.status === 'ACTIVE' || borrow.status === 'RETURNED')
  );
  const usedBooks = cycleBorrows.filter((borrow) => bookOf(borrow)?.kind !== 'puzzle').length;
  const usedPuzzles = cycleBorrows.filter((borrow) => bookOf(borrow)?.kind === 'puzzle').length;
  const quotaTotal =
    allowance.monthlyTotalLimit ||
    (allowance.monthlyBookLimit || 0) + (allowance.monthlyPuzzleLimit || 0);
  const quotaProgress = quotaTotal > 0 ? Math.min(100, (cycleBorrows.length / quotaTotal) * 100) : 0;

  const outWithYou = (borrows ?? []).filter((borrow) => borrow.status !== 'RETURNED');
  const overdueCount = outWithYou.filter(isOverdue).length;
  const unreadCount = (notifications ?? []).filter((n) => !n.isRead).length;

  return (
    <div className="bg-white px-4 pb-[80px] pt-[64px] sm:px-[40px]">
      <div className="max-w-[987px] space-y-[20px]">
        <AccountPageHeader
          title={`Hello, ${user?.name?.split(' ')[0] ?? 'there'}`}
          subtitle="Here's what's happening with your library this month."
        />

        {/* Stat strip */}
        <div className="grid gap-[16px] sm:grid-cols-3">
          <Card className="p-[20px]">
            <p className="font-body text-[11px] font-semibold uppercase leading-[16.5px] tracking-[1.1px] text-slate-muted">
              In your box
            </p>
            <p className="pt-[6px] font-heading text-[28px] font-extrabold leading-[32px] text-night">
              {boxCount}
            </p>
            <Link
              to="/my-box"
              className="mt-[6px] inline-block font-body text-[13px] font-semibold text-lagoon-deep hover:underline"
            >
              Open my box
            </Link>
          </Card>
          <Card className="p-[20px]">
            <p className="font-body text-[11px] font-semibold uppercase leading-[16.5px] tracking-[1.1px] text-slate-muted">
              Books with you
            </p>
            <p className="pt-[6px] font-heading text-[28px] font-extrabold leading-[32px] text-night">
              {outWithYou.length}
            </p>
            <p className="mt-[6px] font-body text-[13px] leading-[20px] text-slate-muted">
              {overdueCount > 0 ? `${overdueCount} overdue` : 'Nothing overdue'}
            </p>
          </Card>
          <Card className="p-[20px]">
            <p className="font-body text-[11px] font-semibold uppercase leading-[16.5px] tracking-[1.1px] text-slate-muted">
              Unread updates
            </p>
            <p className="pt-[6px] font-heading text-[28px] font-extrabold leading-[32px] text-night">
              {unreadCount}
            </p>
            <Link
              to="/account/notifications"
              className="mt-[6px] inline-block font-body text-[13px] font-semibold text-lagoon-deep hover:underline"
            >
              View notifications
            </Link>
          </Card>
        </div>

        {/* Membership */}
        <Card>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              <span className="flex items-center gap-[8px]">
                <Sparkles className="h-[16px] w-[16px] text-lagoon-deep" strokeWidth={1.6} />
                Your membership
              </span>
            </CardTitle>
            <Link
              to="/membership"
              className="font-body text-[14px] font-semibold leading-[20px] text-lagoon-deep hover:underline"
            >
              {activeMember ? 'Change plan' : 'See plans'}
            </Link>
          </div>

          {activeMember && membership ? (
            <div className="pt-[20px]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-heading text-[18px] font-bold leading-[28px] text-night">
                  {allowance.label}
                </p>
                <p className="font-body text-[14px] leading-[20px] text-slate-muted">
                  Valid until {formatDate(membership.endDate)}
                </p>
              </div>

              <div className="mt-[16px] rounded-[16px] bg-[#f9fafb] p-[18px]">
                <div className="flex items-center justify-between">
                  <span className="font-body text-[13px] font-semibold leading-[20px] text-night">
                    This month's quota
                  </span>
                  <span className="font-body text-[13px] font-bold leading-[20px] text-lagoon-deep">
                    {allowance.monthlyTotalLimit
                      ? `${cycleBorrows.length} / ${allowance.monthlyTotalLimit} items`
                      : `${usedBooks} / ${allowance.monthlyBookLimit} books${
                          allowance.monthlyPuzzleLimit
                            ? ` · ${usedPuzzles} / ${allowance.monthlyPuzzleLimit} puzzles`
                            : ''
                        }`}
                  </span>
                </div>
                <div className="mt-[10px] h-[10px] overflow-hidden rounded-full bg-[#e5e7eb]">
                  <div
                    className="h-[10px] rounded-full bg-lagoon"
                    style={{ width: `${quotaProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-[16px]">
              <p className="font-body text-[14px] leading-[20px] text-slate-muted">
                {membership
                  ? 'Your membership is not active right now, so ordering is paused.'
                  : 'You do not have a membership yet — pick a plan to start borrowing.'}
              </p>
              <Link
                to="/membership"
                className="mt-[14px] inline-flex rounded-full bg-lagoon-deep px-[21px] py-[11px] font-body text-[14px] font-semibold leading-[20px] text-white transition-colors hover:bg-lagoon-darkest"
              >
                {membership ? 'Renew membership' : 'Choose a plan'}
              </Link>
            </div>
          )}
        </Card>

        {/* Current order */}
        <Card>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              <span className="flex items-center gap-[8px]">
                <Package className="h-[16px] w-[16px] text-lagoon-deep" strokeWidth={1.6} />
                Current order
              </span>
            </CardTitle>
            <Link
              to="/account/orders"
              className="font-body text-[14px] font-semibold leading-[20px] text-lagoon-deep hover:underline"
            >
              Order history
            </Link>
          </div>

          {isLoading ? (
            <p className="pt-[16px] font-body text-[14px] text-slate-muted">Loading your orders…</p>
          ) : currentOrders.length === 0 ? (
            <p className="pt-[16px] font-body text-[14px] leading-[20px] text-slate-muted">
              No books are out with you right now.{' '}
              <Link to="/library" className="font-semibold text-lagoon-deep hover:underline">
                Browse the library
              </Link>{' '}
              to build your next box.
            </p>
          ) : (
            <div className="space-y-[14px] pt-[18px]">
              {currentOrders.slice(0, 2).map((order) => {
                const meta = ORDER_STATUS_META[order.status];
                return (
                  <div key={order.id} className="rounded-[16px] border border-[#e5e7eb] p-[18px]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-body text-[14px] font-semibold leading-[20px] text-night">
                        Order {order.ref}
                      </span>
                      <span
                        className={`rounded-full px-[12px] py-[4px] font-body text-[12px] font-semibold leading-[16px] ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="pt-[4px] font-body text-[13px] leading-[20px] text-slate-muted">
                      {order.items.length} item{order.items.length === 1 ? '' : 's'} · due{' '}
                      {formatDate(order.dueDate)}
                    </p>
                    <ul className="pt-[10px]">
                      {order.items.slice(0, 3).map((item) => (
                        <li
                          key={item._id}
                          className="truncate font-body text-[13px] leading-[22px] text-[#374151]"
                        >
                          • {bookOf(item)?.title ?? 'Untitled'}
                        </li>
                      ))}
                      {order.items.length > 3 && (
                        <li className="font-body text-[13px] leading-[22px] text-slate-muted">
                          + {order.items.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Notifications preview */}
        <Card>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>
              <span className="flex items-center gap-[8px]">
                <Bell className="h-[16px] w-[16px] text-lagoon-deep" strokeWidth={1.6} />
                Latest updates
              </span>
            </CardTitle>
            <Link
              to="/account/notifications"
              className="font-body text-[14px] font-semibold leading-[20px] text-lagoon-deep hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="space-y-[10px] pt-[18px]">
            {(notifications ?? []).slice(0, 3).map((notification) => (
              <div
                key={notification._id}
                className={`rounded-[14px] border p-[16px] ${
                  notification.isRead
                    ? 'border-[#f3f4f6] bg-[#f9fafb]'
                    : 'border-[#a7d9d2] bg-[#f0faf8]'
                }`}
              >
                <p className="font-body text-[14px] leading-[20px] text-[#374151]">
                  {notification.message}
                </p>
                <p className="pt-[4px] font-body text-[12px] leading-[16px] text-slate-muted">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
            {(notifications ?? []).length === 0 && (
              <p className="font-body text-[14px] leading-[20px] text-slate-muted">
                No notifications yet.
              </p>
            )}
          </div>
        </Card>

        {/* Recommendations */}
        {(recommended?.books.length ?? 0) > 0 && (
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>
                  <span className="flex items-center gap-[8px]">
                    <Wand2 className="h-[16px] w-[16px] text-lagoon-deep" strokeWidth={1.6} />
                    Recommended for you
                  </span>
                </CardTitle>
                <p className="pt-[4px] font-body text-[13px] leading-[20px] text-slate-muted">
                  {recommended?.basis === 'history'
                    ? 'Picked from the categories you have borrowed before.'
                    : 'Fresh additions to get you started.'}
                </p>
              </div>
              <Link
                to="/library"
                className="shrink-0 font-body text-[14px] font-semibold leading-[20px] text-lagoon-deep hover:underline"
              >
                Browse all
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-[14px] pt-[20px] sm:grid-cols-3 lg:grid-cols-6">
              {recommended?.books.map((book) => (
                <Link
                  key={book._id}
                  to={`/library/${book._id}`}
                  className="group flex flex-col overflow-hidden rounded-[14px] border border-[#f3f4f6] transition-all hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-[#f3f4f6]">
                    <img
                      src={
                        book.coverImage ||
                        `https://placehold.co/300x400?text=${encodeURIComponent(book.title)}`
                      }
                      alt={book.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <p className="line-clamp-2 p-[10px] font-body text-[13px] font-semibold leading-[18px] text-night group-hover:text-lagoon-deep">
                    {book.title}
                  </p>
                </Link>
              ))}
            </div>
          </Card>
        )}

        {/* Quick actions */}
        <Card>
          <CardTitle>Quick actions</CardTitle>
          <div className="grid gap-[12px] pt-[18px] sm:grid-cols-3">
            {[
              { to: '/library', label: 'Browse the library', icon: BookOpen },
              { to: '/my-box', label: 'Build my box', icon: Package },
              { to: '/account/profile', label: 'Account settings', icon: Sparkles },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-[10px] rounded-[14px] border border-[#e5e7eb] px-[16px] py-[14px] font-body text-[14px] font-medium leading-[20px] text-[#374151] transition-colors hover:border-lagoon-deep hover:text-lagoon-deep"
              >
                <Icon className="h-[16px] w-[16px] shrink-0" strokeWidth={1.4} />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
