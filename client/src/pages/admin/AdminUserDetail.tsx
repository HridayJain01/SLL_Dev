import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IUser, IMembership, IBorrow } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';
import { PLAN_ORDER, PLAN_DEFINITIONS, getPlanLabel, type PlanCode } from '@/lib/plans';
import { bookOf, formatDate, FULFILMENT_LABEL, isOverdue } from '@/lib/orders';

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const queryClient = useQueryClient();
  const [showMembershipModal, setShowMembershipModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}`);
      return res.data as { user: IUser; membership: IMembership | null; borrows: IBorrow[] };
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      await api.put(`/users/${userId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('User status updated');
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!data?.user) return <div>User not found</div>;

  const { user, membership, borrows } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <div className="flex flex-wrap gap-3">
          {user.status !== 'ACTIVE' && (
            <button onClick={() => updateStatus.mutate('ACTIVE')} className="px-4 py-2 bg-green-600 text-white rounded-lg">Activate</button>
          )}
          {user.status !== 'SUSPENDED' && (
            <button onClick={() => updateStatus.mutate('SUSPENDED')} className="px-4 py-2 bg-red-600 text-white rounded-lg">Suspend</button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-bold mb-4">Details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><p className="text-sm text-gray-500">Name</p><p className="font-medium break-words">{user.name}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-medium break-words">{user.email}</p></div>
          <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{user.phone || 'N/A'}</p></div>
          <div><p className="text-sm text-gray-500">Status</p><p className="font-medium">{user.status}</p></div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Membership</h2>
          <button onClick={() => setShowMembershipModal(true)} className="rounded-lg bg-primary px-3 py-2 text-sm text-white">
            {membership ? 'Update Plan' : 'Assign Plan'}
          </button>
        </div>
        {membership ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div><p className="text-sm text-gray-500">Plan</p><p className="font-medium">{getPlanLabel(membership.plan)}</p></div>
            <div><p className="text-sm text-gray-500">Duration</p><p className="font-medium">{membership.durationMonths} Months</p></div>
            <div><p className="text-sm text-gray-500">Start Date</p><p className="font-medium">{new Date(membership.startDate).toLocaleDateString()}</p></div>
            <div><p className="text-sm text-gray-500">End Date</p><p className="font-medium">{new Date(membership.endDate).toLocaleDateString()}</p></div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No active membership.</p>
        )}
      </div>

      <BorrowHistory borrows={borrows ?? []} />

      {showMembershipModal && (
        <MembershipModal userId={user._id} onClose={() => setShowMembershipModal(false)} />
      )}
    </div>
  );
}

/**
 * What this member has taken, where each item is, and when it is due back —
 * the per-member view of the circulation desk.
 */
function BorrowHistory({ borrows }: { borrows: IBorrow[] }) {
  const out = borrows.filter((borrow) => borrow.status !== 'RETURNED');
  const returned = borrows.filter((borrow) => borrow.status === 'RETURNED');
  const overdueCount = out.filter(isOverdue).length;

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">Borrowing history</h2>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">{out.length} out</span>
          {overdueCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-1 text-red-700">{overdueCount} overdue</span>
          )}
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
            {returned.length} returned
          </span>
        </div>
      </div>

      {borrows.length === 0 ? (
        <p className="text-sm text-gray-500">This member has not borrowed anything yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="py-2 pr-4">Book</th>
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 pr-4">Ordered</th>
                <th className="py-2 pr-4">Delivered</th>
                <th className="py-2 pr-4">Due</th>
                <th className="py-2">Returned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {borrows.map((borrow) => {
                const book = bookOf(borrow);
                const late = isOverdue(borrow);
                return (
                  <tr key={borrow._id} className={late ? 'bg-red-50/60' : undefined}>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={book?.coverImage || 'https://placehold.co/40x56?text=Img'}
                          alt=""
                          loading="lazy"
                          className="h-10 w-7 shrink-0 rounded bg-gray-100 object-cover"
                        />
                        <span className="font-medium text-gray-900">{book?.title ?? 'Untitled'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          late
                            ? 'bg-red-100 text-red-700'
                            : borrow.status === 'RETURNED'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {late ? 'Overdue' : FULFILMENT_LABEL[borrow.fulfilment]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">{formatDate(borrow.issueDate)}</td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {borrow.deliveredAt ? formatDate(borrow.deliveredAt) : '—'}
                    </td>
                    <td className={`py-2.5 pr-4 ${late ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                      {borrow.dueDate ? formatDate(borrow.dueDate) : '—'}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {borrow.returnDate ? formatDate(borrow.returnDate) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MembershipModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState<PlanCode>('LITTLE_READER');
  const [duration, setDuration] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  const createMembership = useMutation({
    mutationFn: async () => {
      await api.post('/memberships', {
        userId,
        plan,
        durationMonths: duration,
        startDate: new Date(startDate).toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user', userId] });
      toast.success('Membership assigned');
      onClose();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
      <div className="max-h-full w-full max-w-sm space-y-4 overflow-y-auto rounded-xl bg-white p-5 sm:p-6">
        <h3 className="text-xl font-bold">Assign Membership</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value as PlanCode)} className="w-full border p-2 rounded">
            {PLAN_ORDER.map((planCode) => (
              <option key={planCode} value={planCode}>
                {PLAN_DEFINITIONS[planCode].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Duration (Months)</label>
          <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full border p-2 rounded">
            <option value={1}>1 Month</option>
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={() => createMembership.mutate()} className="px-4 py-2 bg-primary text-white rounded">Assign</button>
        </div>
      </div>
    </div>
  );
}
