import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IMembership, IBorrow } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';

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

  if (mLoading || bLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Membership Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold mb-4">Current Membership</h2>
          {membershipData ? (
            <div>
              <p className="font-bold text-primary mb-1">{membershipData.plan} Plan</p>
              <p className="text-sm text-gray-500 mb-4">
                Valid until {new Date(membershipData.endDate).toLocaleDateString()}
              </p>
              <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Quota</span>
                <span className="text-lg font-bold text-gray-900">
                  {borrowsData?.length || 0} / {membershipData.booksPerCycle} Books
                </span>
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
          <h2 className="text-lg font-bold mb-4">Current Borrowed Books</h2>
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
    </div>
  );
}
