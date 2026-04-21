import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IBorrow } from '@/types';
import { toast } from 'sonner';

export default function AdminInventory() {
  const queryClient = useQueryClient();
  const [showAssignModal, setShowAssignModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-borrows'],
    queryFn: async () => {
      const res = await api.get('/borrows');
      return res.data.borrows as IBorrow[];
    },
  });

  const markReturned = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/borrows/${id}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-borrows'] });
      toast.success('Book marked as returned');
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory & Borrows</h1>
        <button onClick={() => setShowAssignModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg font-medium">Assign Book</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.map((borrow) => {
              const user = borrow.userId as any;
              const book = borrow.bookId as any;
              const isOverdue = new Date(borrow.dueDate) < new Date() && borrow.status === 'ACTIVE';
              return (
                <tr key={borrow._id} className={isOverdue ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 text-sm">{user.name}</td>
                  <td className="px-6 py-4 text-sm font-medium">{book.title}</td>
                  <td className="px-6 py-4 text-sm">{new Date(borrow.dueDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 text-xs rounded-full ${borrow.status === 'ACTIVE' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}`}>
                      {isOverdue ? 'OVERDUE' : borrow.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {borrow.status === 'ACTIVE' && (
                      <button onClick={() => markReturned.mutate(borrow._id)} className="text-primary hover:underline text-sm">Mark Returned</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAssignModal && (
        <AssignBookModal onClose={() => setShowAssignModal(false)} />
      )}
    </div>
  );
}

function AssignBookModal({ onClose }: { onClose: () => void }) {
  const [userId, setUserId] = useState('');
  const [bookId, setBookId] = useState('');
  const queryClient = useQueryClient();

  const assign = useMutation({
    mutationFn: async () => {
      await api.post('/borrows', { userId, bookId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-borrows'] });
      toast.success('Book assigned successfully');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error assigning book'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 space-y-4">
        <h3 className="text-xl font-bold">Assign Book</h3>
        <div><label className="block text-sm mb-1">User ID</label><input value={userId} onChange={e => setUserId(e.target.value)} className="w-full border p-2 rounded" /></div>
        <div><label className="block text-sm mb-1">Book ID</label><input value={bookId} onChange={e => setBookId(e.target.value)} className="w-full border p-2 rounded" /></div>
        <div className="flex justify-end space-x-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={() => assign.mutate()} className="px-4 py-2 bg-primary text-white rounded">Assign</button>
        </div>
      </div>
    </div>
  );
}
