import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Inbox,
  MapPin,
  PackageCheck,
  Phone,
  Truck,
  UserCheck,
} from 'lucide-react';
import api from '@/lib/axios';
import { IBorrow } from '@/types';
import {
  addressOf,
  bookOf,
  daysUntilDue,
  formatDate,
  groupBorrowsIntoOrders,
  isOverdue,
  memberOf,
  Order,
} from '@/lib/orders';
import { cn } from '@/lib/utils';

/**
 * The circulation desk — every book that is out, bucketed by what needs doing
 * to it next, plus a record of what came back and when.
 *
 * Rows are grouped into orders (one member, one checkout) because that is the
 * unit a delivery partner actually carries, and every lifecycle endpoint takes
 * a batch of borrow ids.
 */

type TabKey = 'DISPATCH' | 'DELIVERING' | 'WITH_MEMBERS' | 'PICKUPS' | 'OVERDUE' | 'RETURNED';

/** Stages in which the member physically holds the book. Mirrors the server. */
const WITH_MEMBER_STATES: IBorrow['fulfilment'][] = [
  'WITH_MEMBER',
  'RETURN_REQUESTED',
  'PICKUP_SCHEDULED',
];

/** A loan this close to its due date is worth flagging before it goes late. */
const DUE_SOON_DAYS = 3;

const TABS: { key: TabKey; label: string; blurb: string }[] = [
  { key: 'DISPATCH', label: 'To dispatch', blurb: 'Paid orders waiting to be packed and assigned to a delivery partner.' },
  { key: 'DELIVERING', label: 'Out for delivery', blurb: 'On the way. Mark delivered on handover — that is when the loan clock starts.' },
  { key: 'WITH_MEMBERS', label: 'With members', blurb: 'Delivered and being read. These are the books currently in members’ hands.' },
  { key: 'PICKUPS', label: 'Return pickups', blurb: 'Members have asked for these to be collected. This queue only fills when a member requests a return — to chase a book nobody has asked to return, use With members or Overdue.' },
  { key: 'OVERDUE', label: 'Overdue', blurb: 'Past their return date and still not back. Chase these first.' },
  { key: 'RETURNED', label: 'Recently returned', blurb: 'The last 200 books to come back, newest first.' },
];

export default function AdminCirculation() {
  const [tab, setTab] = useState<TabKey>('DISPATCH');
  const [modal, setModal] = useState<{ order: Order; leg: 'delivery' | 'pickup' } | null>(null);
  const queryClient = useQueryClient();

  // Everything still out. Bounded by physical stock, so one fetch covers every
  // live queue and keeps the tab counts honest.
  const { data: openBorrows, isLoading } = useQuery({
    queryKey: ['borrows', 'circulation', 'open'],
    queryFn: async () => {
      const res = await api.get('/borrows', { params: { status: 'ACTIVE' } });
      return res.data.borrows as IBorrow[];
    },
  });

  // Returned history grows forever, so it is fetched separately and capped.
  const { data: returnedBorrows } = useQuery({
    queryKey: ['borrows', 'circulation', 'returned'],
    queryFn: async () => {
      const res = await api.get('/borrows', { params: { status: 'RETURNED', limit: 200 } });
      return res.data.borrows as IBorrow[];
    },
    enabled: tab === 'RETURNED',
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['borrows'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    queryClient.invalidateQueries({ queryKey: ['admin-books'] });
  };

  const act = useMutation({
    mutationFn: async ({ path, body }: { path: string; body: Record<string, unknown> }) => {
      const res = await api.post(`/borrows/${path}`, body);
      return res.data as { message: string };
    },
    onSuccess: (data) => {
      invalidate();
      setModal(null);
      toast.success(data.message);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not update these books'),
  });

  const buckets = useMemo(() => {
    const open = openBorrows ?? [];
    // A past due date on a copy that is not back is the whole test, and it is
    // the one fact here that cannot be wrong: `dueDate` is only ever written at
    // delivery, so a book carrying one is provably in a member's hands.
    //
    // This deliberately does not also require a with-member `fulfilment`. That
    // extra condition made the queue trust a second, weaker field — and any row
    // whose fulfilment was missing or stale (rows predating the lifecycle
    // migration read as PREPARING) vanished from every queue that matters while
    // still sitting in someone's living room.
    const overdue = open.filter(isOverdue);
    const overdueIds = new Set(overdue.map((b) => b._id));

    return {
      // Late books cannot honestly be described as awaiting dispatch or in
      // transit, so they are pulled out of the outbound queues.
      DISPATCH: open.filter((b) => b.fulfilment === 'PREPARING' && !overdueIds.has(b._id)),
      DELIVERING: open.filter((b) => b.fulfilment === 'OUT_FOR_DELIVERY' && !overdueIds.has(b._id)),
      // Overdue books appear in their own tab; this one is the healthy set.
      WITH_MEMBERS: open.filter((b) => b.fulfilment === 'WITH_MEMBER' && !overdueIds.has(b._id)),
      // Pickups stay listed even when late — a collection already asked for is
      // actionable here, and the card still shows the days-late badge.
      PICKUPS: open.filter(
        (b) => b.fulfilment === 'RETURN_REQUESTED' || b.fulfilment === 'PICKUP_SCHEDULED'
      ),
      OVERDUE: overdue,
      RETURNED: returnedBorrows ?? [],
    } satisfies Record<TabKey, IBorrow[]>;
  }, [openBorrows, returnedBorrows]);

  const orders = useMemo(() => groupBorrowsIntoOrders(buckets[tab]), [buckets, tab]);
  const activeTab = TABS.find((t) => t.key === tab)!;

  // Headline numbers for the whole desk, so the state of circulation reads off
  // the top of the page without having to click through every queue.
  const summary = useMemo(() => {
    const open = openBorrows ?? [];
    // Anyone physically holding a copy — by fulfilment, or by having a due date
    // that has already passed.
    const held = open.filter((b) => WITH_MEMBER_STATES.includes(b.fulfilment) || isOverdue(b));
    const dueSoon = held.filter((b) => {
      const left = daysUntilDue(b.dueDate);
      return left !== null && left >= 0 && left <= DUE_SOON_DAYS;
    });
    return {
      out: open.length,
      members: new Set(held.map((b) => memberOf(b)?._id ?? String(b.userId))).size,
      inTransit: buckets.DISPATCH.length + buckets.DELIVERING.length,
      dueSoon: dueSoon.length,
      overdue: buckets.OVERDUE.length,
    };
  }, [openBorrows, buckets]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Circulation</h1>
        <p className="text-gray-500">
          Who has what, when it is due back, and what needs moving next.
        </p>
      </div>

      <SummaryStrip summary={summary} onShowOverdue={() => setTab('OVERDUE')} />

      {/* Queue tabs double as the at-a-glance counts. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((item) => {
          const count = buckets[item.key].length;
          const isOverdueTab = item.key === 'OVERDUE';
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={cn(
                'flex flex-shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition',
                tab === item.key
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 text-gray-500 hover:text-gray-900'
              )}
            >
              {item.label}
              {(count > 0 || item.key !== 'RETURNED') && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs font-semibold',
                    isOverdueTab && count > 0
                      ? 'bg-red-100 text-red-700'
                      : tab === item.key
                        ? 'bg-primary/15 text-primary'
                        : 'bg-gray-100 text-gray-500'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-gray-500">{activeTab.blurb}</p>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading circulation…</p>
      ) : orders.length === 0 ? (
        <EmptyQueue tab={tab} />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              tab={tab}
              busy={act.isPending}
              onAssignDelivery={() => setModal({ order, leg: 'delivery' })}
              onAssignPickup={() => setModal({ order, leg: 'pickup' })}
              onMarkDelivered={() =>
                act.mutate({
                  path: 'mark-delivered',
                  body: { borrowIds: order.items.map((i) => i._id) },
                })
              }
              onMarkCollected={() =>
                act.mutate({
                  path: 'mark-collected',
                  body: { borrowIds: order.items.map((i) => i._id) },
                })
              }
            />
          ))}
        </div>
      )}

      {modal && (
        <PartnerModal
          order={modal.order}
          leg={modal.leg}
          busy={act.isPending}
          onClose={() => setModal(null)}
          onSubmit={(values) =>
            act.mutate({
              path: modal.leg === 'delivery' ? 'assign-delivery' : 'assign-pickup',
              body: { borrowIds: modal.order.items.map((i) => i._id), ...values },
            })
          }
        />
      )}
    </div>
  );
}

function SummaryStrip({
  summary,
  onShowOverdue,
}: {
  summary: { out: number; members: number; inTransit: number; dueSoon: number; overdue: number };
  onShowOverdue: () => void;
}) {
  const tiles = [
    { label: 'Books out', value: summary.out, icon: PackageCheck, tone: 'text-gray-900' },
    { label: 'Members holding', value: summary.members, icon: UserCheck, tone: 'text-gray-900' },
    { label: 'In transit', value: summary.inTransit, icon: Truck, tone: 'text-gray-900' },
    {
      label: `Due in ${DUE_SOON_DAYS} days`,
      value: summary.dueSoon,
      icon: CalendarClock,
      tone: summary.dueSoon > 0 ? 'text-amber-600' : 'text-gray-900',
    },
    {
      label: 'Overdue',
      value: summary.overdue,
      icon: AlertTriangle,
      tone: summary.overdue > 0 ? 'text-red-600' : 'text-gray-900',
      onClick: summary.overdue > 0 ? onShowOverdue : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const Tag = tile.onClick ? 'button' : 'div';
        return (
          <Tag
            key={tile.label}
            {...(tile.onClick ? { type: 'button' as const, onClick: tile.onClick } : {})}
            className={cn(
              'rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm',
              tile.onClick && 'transition hover:border-red-200'
            )}
          >
            <p className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Icon className="h-3.5 w-3.5 text-gray-400" />
              {tile.label}
            </p>
            <p className={cn('mt-1 text-2xl font-bold', tile.tone)}>{tile.value}</p>
          </Tag>
        );
      })}
    </div>
  );
}

function EmptyQueue({ tab }: { tab: TabKey }) {
  const copy: Record<TabKey, { icon: typeof Inbox; text: string }> = {
    DISPATCH: { icon: Inbox, text: 'Nothing waiting to be packed.' },
    DELIVERING: { icon: Truck, text: 'No deliveries in progress.' },
    WITH_MEMBERS: {
      icon: UserCheck,
      text: 'No books are out with members and on time. Anything past its return date is listed under Overdue.',
    },
    PICKUPS: { icon: Truck, text: 'No member has requested a collection. Books still out are under With members and Overdue.' },
    OVERDUE: { icon: CheckCircle2, text: 'Nothing is overdue. Everything is on time.' },
    RETURNED: { icon: PackageCheck, text: 'No returns recorded yet.' },
  };
  const { icon: Icon, text } = copy[tab];
  return (
    <div className="rounded-2xl border border-gray-100 bg-white py-14 text-center shadow-sm">
      <Icon className="mx-auto mb-3 h-8 w-8 text-gray-300" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

function OrderCard({
  order,
  tab,
  busy,
  onAssignDelivery,
  onAssignPickup,
  onMarkDelivered,
  onMarkCollected,
}: {
  order: Order;
  tab: TabKey;
  busy: boolean;
  onAssignDelivery: () => void;
  onAssignPickup: () => void;
  onMarkDelivered: () => void;
  onMarkCollected: () => void;
}) {
  const member = memberOf(order.items[0]);
  const address = addressOf(member);
  const overdue = order.items.some(isOverdue);
  const daysLeft = daysUntilDue(order.dueDate);
  const daysLate = overdue && daysLeft !== null ? Math.abs(daysLeft) : 0;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border bg-white shadow-sm',
        overdue ? 'border-red-200' : 'border-gray-100'
      )}
    >
      {/* Who, and the dates that matter for this queue */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {member ? (
              <Link
                to={`/admin/users/${member._id}`}
                className="font-semibold text-gray-900 hover:text-primary"
              >
                {member.name}
              </Link>
            ) : (
              <span className="font-semibold text-gray-900">Unknown member</span>
            )}
            <span className="rounded-full bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-500">
              {order.ref}
            </span>
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                <AlertTriangle className="h-3 w-3" />
                {daysLate} day{daysLate === 1 ? '' : 's'} late
              </span>
            )}
          </div>
          <p className="mt-0.5 break-words text-sm text-gray-500">
            {member?.email}
            {member?.phone && ` · ${member.phone}`}
          </p>
          {/* Where the box has to go — the reason this queue exists. */}
          {address && (
            <p className="mt-1 flex items-start gap-1.5 break-words text-sm text-gray-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
              <span>{address}</span>
            </p>
          )}
        </div>

        <div className="shrink-0 text-right text-sm">
          <p className="text-gray-500">Ordered {formatDate(order.placedAt)}</p>
          {order.deliveredAt && (
            <p className="text-gray-500">Delivered {formatDate(order.deliveredAt)}</p>
          )}
          {order.dueDate ? (
            <>
              <p className={overdue ? 'font-semibold text-red-600' : 'font-medium text-gray-900'}>
                Due {formatDate(order.dueDate)}
              </p>
              {!overdue && daysLeft !== null && (
                <p
                  className={cn(
                    'font-semibold',
                    daysLeft <= DUE_SOON_DAYS ? 'text-amber-600' : 'text-gray-500'
                  )}
                >
                  {daysLeft <= 0
                    ? 'Due today'
                    : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                </p>
              )}
            </>
          ) : (
            <p className="text-gray-400">Due date starts on delivery</p>
          )}
        </div>
      </div>

      {/* Titles */}
      <ul className="divide-y divide-gray-100">
        {order.items.map((item) => {
          const book = bookOf(item);
          return (
            <li key={item._id} className="flex items-center gap-3 px-5 py-3">
              <img
                src={book?.coverImage || 'https://placehold.co/40x56?text=Img'}
                alt=""
                loading="lazy"
                className="h-11 w-8 shrink-0 rounded object-cover bg-gray-100"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">{book?.title}</p>
                <p className="truncate text-xs text-gray-400">
                  {book?.shelfCode ? `${book.shelfCode} · ` : ''}
                  {book?.kind === 'puzzle' ? 'Puzzle' : 'Book'}
                </p>
              </div>
              {tab === 'RETURNED' && item.returnDate && (
                <span className="shrink-0 text-xs text-gray-500">
                  Returned {formatDate(item.returnDate)}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      {/* Partner records — both legs stay visible once set */}
      {(order.delivery?.partnerName || order.pickup?.partnerName) && (
        <div className="space-y-1 border-t border-gray-100 bg-gray-50/60 px-5 py-3 text-xs text-gray-600">
          {order.delivery?.partnerName && (
            <p className="flex flex-wrap items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-gray-400" />
              Delivery: <span className="font-semibold text-gray-900">{order.delivery.partnerName}</span>
              {order.delivery.partnerPhone && (
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <Phone className="h-3 w-3" />
                  {order.delivery.partnerPhone}
                </span>
              )}
              {order.delivery.eta && !order.delivery.completedAt && <span>· ETA {order.delivery.eta}</span>}
            </p>
          )}
          {order.pickup?.partnerName && (
            <p className="flex flex-wrap items-center gap-1.5">
              <PackageCheck className="h-3.5 w-3.5 text-gray-400" />
              Pickup: <span className="font-semibold text-gray-900">{order.pickup.partnerName}</span>
              {order.pickup.partnerPhone && (
                <span className="inline-flex items-center gap-1 text-gray-500">
                  <Phone className="h-3 w-3" />
                  {order.pickup.partnerPhone}
                </span>
              )}
              {order.pickup.eta && !order.pickup.completedAt && <span>· ETA {order.pickup.eta}</span>}
            </p>
          )}
        </div>
      )}

      {/* One row of actions, scoped to what this queue can actually do next */}
      {tab !== 'RETURNED' && (
        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-3">
          {tab === 'DISPATCH' && (
            <PrimaryAction onClick={onAssignDelivery} disabled={busy} icon={Truck}>
              Assign delivery partner
            </PrimaryAction>
          )}
          {tab === 'DELIVERING' && (
            <>
              <SecondaryAction onClick={onAssignDelivery} disabled={busy}>
                Change partner
              </SecondaryAction>
              <PrimaryAction onClick={onMarkDelivered} disabled={busy} icon={PackageCheck}>
                Mark delivered
              </PrimaryAction>
            </>
          )}
          {(tab === 'WITH_MEMBERS' || tab === 'OVERDUE') && (
            <PrimaryAction onClick={onAssignPickup} disabled={busy} icon={Truck}>
              Schedule pickup
            </PrimaryAction>
          )}
          {tab === 'PICKUPS' && (
            <>
              <SecondaryAction onClick={onAssignPickup} disabled={busy}>
                {order.pickup?.partnerName ? 'Change partner' : 'Assign pickup partner'}
              </SecondaryAction>
              <PrimaryAction onClick={onMarkCollected} disabled={busy} icon={CheckCircle2}>
                Mark collected
              </PrimaryAction>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function PrimaryAction({
  onClick,
  disabled,
  icon: Icon,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function SecondaryAction({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function PartnerModal({
  order,
  leg,
  busy,
  onClose,
  onSubmit,
}: {
  order: Order;
  leg: 'delivery' | 'pickup';
  busy: boolean;
  onClose: () => void;
  onSubmit: (values: { personName: string; personPhone?: string; eta?: string }) => void;
}) {
  const existing = leg === 'delivery' ? order.delivery : order.pickup;
  const [personName, setPersonName] = useState(existing?.partnerName ?? '');
  const [personPhone, setPersonPhone] = useState(existing?.partnerPhone ?? '');
  const [eta, setEta] = useState(existing?.eta ?? '');

  const member = memberOf(order.items[0]);
  const verb = leg === 'delivery' ? 'deliver to' : 'collect from';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) return;
    onSubmit({
      personName: personName.trim(),
      personPhone: personPhone.trim() || undefined,
      eta: eta.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <form
        onSubmit={submit}
        className="max-h-full w-full max-w-sm space-y-4 overflow-y-auto rounded-xl bg-white p-5 sm:p-6"
      >
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            {leg === 'delivery' ? 'Assign delivery partner' : 'Assign pickup partner'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {order.items.length} item{order.items.length === 1 ? '' : 's'} to {verb}{' '}
            <span className="font-medium text-gray-700">{member?.name}</span>. They will be emailed
            the partner's details.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Partner name</label>
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            required
            autoFocus
            placeholder="e.g. Ravi Kumar"
            className="w-full rounded border border-gray-200 p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone (optional)</label>
          <input
            value={personPhone}
            onChange={(e) => setPersonPhone(e.target.value)}
            placeholder="e.g. 98765 43210"
            className="w-full rounded border border-gray-200 p-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">ETA (optional)</label>
          <input
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            placeholder="e.g. Tomorrow, 4–6 pm"
            className="w-full rounded border border-gray-200 p-2"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded border px-4 py-2">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !personName.trim()}
            className="rounded bg-primary px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {busy ? 'Saving…' : 'Assign & notify'}
          </button>
        </div>
      </form>
    </div>
  );
}
