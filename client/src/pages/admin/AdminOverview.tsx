import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Link } from 'react-router-dom';
import { Users, BookOpen, AlertTriangle, ArrowRight, Package, PackageCheck, Truck } from 'lucide-react';
import type { ReactNode } from 'react';

export default function AdminOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await api.get('/users/stats/overview');
      return res.data as {
        stats: {
          totalUsers: number;
          activeMembers: number;
          totalBooks: number;
          booksOut: number;
          overdueBooks: number;
          pendingUsers: number;
          awaitingDispatch: number;
          outForDelivery: number;
          pickupsPending: number;
        };
        recentBorrows: { _id: string; createdAt: string; dueDate: string; userId: any; bookId: any }[];
      };
    },
  });

  if (isLoading) return <div>Loading...</div>;

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Overview</h1>
        <p className="text-gray-500">Live system metrics, overdue alerts, and recent circulation activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={stats?.totalUsers || 0} />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Active Members" value={stats?.activeMembers || 0} />
        <StatCard icon={<BookOpen className="h-5 w-5" />} label="Total Books" value={stats?.totalBooks || 0} />
        <StatCard icon={<ArrowRight className="h-5 w-5" />} label="Books Out" value={stats?.booksOut || 0} />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} label="Overdue" value={stats?.overdueBooks || 0} to="/admin/circulation" tone="danger" />
        <StatCard icon={<Users className="h-5 w-5" />} label="Pending" value={stats?.pendingUsers || 0} />
      </div>

      {/* The three counts that mean somebody has to do something today. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
        <StatCard icon={<Package className="h-5 w-5" />} label="To dispatch" value={stats?.awaitingDispatch || 0} to="/admin/circulation" />
        <StatCard icon={<Truck className="h-5 w-5" />} label="Out for delivery" value={stats?.outForDelivery || 0} to="/admin/circulation" />
        <StatCard icon={<PackageCheck className="h-5 w-5" />} label="Pickups pending" value={stats?.pickupsPending || 0} to="/admin/circulation" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Orders</h2>
          <div className="space-y-4">
            {data?.recentBorrows?.map((borrow) => (
              <div key={borrow._id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3">
                <div className="min-w-0">
                  <p className="break-words font-medium text-gray-900">{borrow.bookId?.title}</p>
                  <p className="break-words text-sm text-gray-500">{borrow.userId?.name} · Due {new Date(borrow.dueDate).toLocaleDateString()}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold uppercase text-primary">New</span>
              </div>
            ))}
            {(!data?.recentBorrows || data.recentBorrows.length === 0) && <p className="text-sm text-gray-500">No recent circulation activity.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="space-y-3">
            <Link to="/admin/users" className="block rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary">Manage Users</Link>
            <Link to="/admin/books" className="block rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary">Manage Books</Link>
            <Link to="/admin/circulation" className="block rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary">Circulation Desk</Link>
            <Link to="/admin/inventory" className="block rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary">Inventory Queue</Link>
            <Link to="/admin/notifications" className="block rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary">Send Notifications</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  to,
  tone = 'default',
}: {
  icon: ReactNode;
  label: string;
  value: number;
  /** Makes the card a shortcut into the queue it counts. */
  to?: string;
  tone?: 'default' | 'danger';
}) {
  const danger = tone === 'danger' && value > 0;
  const body = (
    <>
      <div
        className={`mb-3 inline-flex rounded-xl p-2 ${
          danger ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
        }`}
      >
        {icon}
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
    </>
  );

  const className = `block rounded-2xl border bg-white p-5 shadow-sm transition-colors ${
    danger ? 'border-red-200' : 'border-gray-100'
  } ${to ? 'hover:border-primary' : ''}`;

  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
