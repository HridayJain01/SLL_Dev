import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBorrow } from '@/types';

export default function MyBooks() {
  const [activeTab, setActiveTab] = useState<'CURRENT' | 'HISTORY'>('CURRENT');

  const { data, isLoading } = useQuery({
    queryKey: ['borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
  });

  const filteredBorrows = useMemo(() => {
    return (data || []).filter((borrow) => {
      if (activeTab === 'CURRENT') return borrow.status === 'ACTIVE' || borrow.status === 'OVERDUE';
      return borrow.status === 'RETURNED';
    });
  }, [activeTab, data]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Books</h1>
          <p className="text-gray-500">Track active orders and completed returns in one place.</p>
        </div>
        <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
          <button
            onClick={() => setActiveTab('CURRENT')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'CURRENT' ? 'bg-primary text-white' : 'text-gray-600'}`}
          >
            Current
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'HISTORY' ? 'bg-primary text-white' : 'text-gray-600'}`}
          >
            History
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBorrows.map((borrow) => {
              const book = borrow.bookId as any;
              const isOverdue = borrow.status === 'OVERDUE';
              return (
                <tr key={borrow._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img src={book.coverImage || 'https://placehold.co/100x150?text=Book'} alt="" className="h-10 w-8 object-cover rounded mr-3" />
                      <div className="text-sm font-medium text-gray-900">{book.title}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(borrow.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(borrow.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${borrow.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : ''}
                      ${borrow.status === 'RETURNED' ? 'bg-green-100 text-green-800' : ''}
                      ${borrow.status === 'OVERDUE' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {isOverdue ? 'OVERDUE' : borrow.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredBorrows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  {activeTab === 'CURRENT' ? 'You do not have any active orders right now.' : 'No returned books yet.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
