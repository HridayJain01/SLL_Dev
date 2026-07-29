import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IUser } from '@/types';
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data.users as IUser[];
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      </div>
      
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        {/* The wrapper clips to the rounded corners, so the table needs its own
            scroll container or narrow screens lose the right-hand columns. */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Role</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 sm:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {data?.map((user) => (
                <tr key={user._id}>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900 sm:px-6">{user.name}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 sm:px-6">{user.email}</td>
                  <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
                      ${user.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : ''}
                      ${user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {user.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-500 sm:px-6">{user.role}</td>
                  <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium sm:px-6">
                    <Link to={`/admin/users/${user._id}`} className="text-primary hover:text-primary-dark">View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
