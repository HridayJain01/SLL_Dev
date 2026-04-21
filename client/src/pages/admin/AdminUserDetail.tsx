import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { IUser, IMembership, IBorrow } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';

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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <div className="space-x-3">
          {user.status !== 'ACTIVE' && (
            <button onClick={() => updateStatus.mutate('ACTIVE')} className="px-4 py-2 bg-green-600 text-white rounded-lg">Activate</button>
          )}
          {user.status !== 'SUSPENDED' && (
            <button onClick={() => updateStatus.mutate('SUSPENDED')} className="px-4 py-2 bg-red-600 text-white rounded-lg">Suspend</button>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4">Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><p className="text-sm text-gray-500">Name</p><p className="font-medium">{user.name}</p></div>
          <div><p className="text-sm text-gray-500">Email</p><p className="font-medium">{user.email}</p></div>
          <div><p className="text-sm text-gray-500">Phone</p><p className="font-medium">{user.phone || 'N/A'}</p></div>
          <div><p className="text-sm text-gray-500">Status</p><p className="font-medium">{user.status}</p></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Membership</h2>
          <button onClick={() => setShowMembershipModal(true)} className="px-3 py-1 bg-primary text-white text-sm rounded-lg">
            {membership ? 'Update Plan' : 'Assign Plan'}
          </button>
        </div>
        {membership ? (
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Plan</p><p className="font-medium">{membership.plan}</p></div>
            <div><p className="text-sm text-gray-500">Duration</p><p className="font-medium">{membership.durationMonths} Months</p></div>
            <div><p className="text-sm text-gray-500">Start Date</p><p className="font-medium">{new Date(membership.startDate).toLocaleDateString()}</p></div>
            <div><p className="text-sm text-gray-500">End Date</p><p className="font-medium">{new Date(membership.endDate).toLocaleDateString()}</p></div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No active membership.</p>
        )}
      </div>

      {showMembershipModal && (
        <MembershipModal userId={user._id} onClose={() => setShowMembershipModal(false)} />
      )}
    </div>
  );
}

function MembershipModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState('NORMAL');
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-96 space-y-4">
        <h3 className="text-xl font-bold">Assign Membership</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full border p-2 rounded">
            <option value="NORMAL">Normal</option>
            <option value="PREMIUM">Premium</option>
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
