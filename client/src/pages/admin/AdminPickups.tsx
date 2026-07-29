import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Truck, CheckCircle2 } from 'lucide-react';
import api from '@/lib/axios';
import { IBorrow } from '@/types';

export default function AdminPickups() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['borrows', 'pickups'],
    queryFn: async () => {
      const res = await api.get('/borrows', { params: { returnRequested: 'true' } });
      return res.data.borrows as IBorrow[];
    },
  });

  const markReturned = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/borrows/${id}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['borrows'] });
      toast.success('Marked as collected and returned');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not update borrow');
    },
  });

  // A return stays in the queue until the delivery partner confirms collection.
  const pending = (data || []).filter((borrow) => borrow.status !== 'RETURNED');

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Return Pickups</h1>
        <p className="text-gray-500">Books members have requested for return pickup. Mark them returned once collected.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pending.map((borrow) => {
                const book = borrow.bookId as any;
                const member = borrow.userId as any;
                return (
                  <tr key={borrow._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={book?.coverImage || 'https://placehold.co/100x150?text=Book'} alt="" className="h-10 w-8 object-cover rounded mr-3" />
                        <div className="text-sm font-medium text-gray-900">{book?.title}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="font-medium">{member?.name}</div>
                      <div className="text-gray-500">{member?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(borrow.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {borrow.returnRequestedAt ? new Date(borrow.returnRequestedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => markReturned.mutate(borrow._id)}
                        disabled={markReturned.isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark Collected
                      </button>
                    </td>
                  </tr>
                );
              })}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    <Truck className="mx-auto mb-3 h-8 w-8 text-gray-300" />
                    No pending return pickups right now.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
