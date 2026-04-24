import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IMembership, IBorrow, INotification } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, Clock3, Sparkles } from 'lucide-react';

export default function DashboardOverview() {
  const user = useAuthStore((s) => s.user);
  
  const { data: membershipData, isLoading: mLoading } = useQuery({
    queryKey: ['membership', 'me'],
    queryFn: async () => {
      const res = await api.get('/memberships/me');
      return res.data.membership as IMembership;
    },
  });

  const { data: borrowsData, isLoading: bLoading } = useQuery({
    queryKey: ['borrows', 'active'],
    queryFn: async () => {
      const res = await api.get('/borrows', { params: { status: 'ACTIVE' } });
      return res.data.borrows as IBorrow[];
    },
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/me');
      return res.data.notifications as INotification[];
    },
  });

  if (mLoading || bLoading) return <div>Loading...</div>;

  const activeCount = borrowsData?.length || 0;
  const quota = membershipData?.booksPerCycle || 0;
  const quotaProgress = quota > 0 ? Math.min(100, Math.round((activeCount / quota) * 100)) : 0;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm/6 text-white/80">Dashboard</p>
            <h1 className="text-2xl font-bold sm:text-3xl">Welcome, {user?.name}</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
            <Sparkles className="h-4 w-4" />
            Ready to borrow
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Membership Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Current Membership</h2>
          {membershipData ? (
            <div>
              <p className="font-bold text-primary mb-1">{membershipData.plan} Plan</p>
              <p className="text-sm text-gray-500 mb-4">
                Valid until {new Date(membershipData.endDate).toLocaleDateString()}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Monthly Quota</span>
                  <span className="text-lg font-bold text-gray-900">
                    {activeCount} / {membershipData.booksPerCycle} Books
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-200">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${quotaProgress}%` }} />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-4">You do not have an active membership.</p>
              <Link to="/membership" className="text-primary hover:underline font-medium">Get a Membership</Link>
            </div>
          )}
        </div>
        
        {/* Current Books */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Current Borrowed Books</h2>
          {borrowsData && borrowsData.length > 0 ? (
            <ul className="space-y-4">
              {borrowsData.slice(0, 3).map((borrow) => {
                const book = borrow.bookId as any;
                const dueDate = new Date(borrow.dueDate);
                const isOverdue = dueDate < new Date();
                
                return (
                  <li key={borrow._id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900 line-clamp-1">{book.title}</p>
                      <p className={`text-sm ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                        Due: {dueDate.toLocaleDateString()}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No books currently borrowed.</p>
          )}
          <Link to="/dashboard/my-books" className="mt-4 inline-block text-sm text-primary hover:underline font-medium">
            View All
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Bell className="h-4 w-4 text-primary" /> Latest Notifications</h2>
          <div className="space-y-3">
            {notifications?.slice(0, 3).map((notification) => (
              <div key={notification._id} className={`rounded-xl border p-4 ${notification.isRead ? 'border-gray-100 bg-gray-50' : 'border-blue-100 bg-blue-50'}`}>
                <p className="text-sm text-gray-800">{notification.message}</p>
                <p className="mt-1 text-xs text-gray-500">{new Date(notification.createdAt).toLocaleString()}</p>
              </div>
            ))}
            {notifications?.length === 0 && <p className="text-sm text-gray-500">No notifications yet.</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /> Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link to="/library" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary">
              Browse Library
            </Link>
            <Link to="/dashboard/preferences" className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary">
              Open Order List
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
