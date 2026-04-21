import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBorrow } from '@/types';

export default function MyBooks() {
  const { data, isLoading } = useQuery({
    queryKey: ['borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Books</h1>
      
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
            {data?.map((borrow) => {
              const book = borrow.bookId as any;
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
                      {borrow.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  You haven't borrowed any books yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
