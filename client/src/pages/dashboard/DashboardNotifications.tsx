import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { INotification } from '@/types';
import { Check } from 'lucide-react';

export default function DashboardNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/me');
      return res.data.notifications as INotification[];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {data?.some((n) => !n.isRead) && (
          <button
            onClick={() => markAllRead.mutate()}
            className="text-sm text-primary hover:text-primary-dark font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {data?.map((notif) => (
          <div key={notif._id} className={`p-4 rounded-xl border ${notif.isRead ? 'bg-gray-50 border-gray-100' : 'bg-blue-50 border-blue-100'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm mb-1 ${notif.isRead ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                  {notif.message}
                </p>
                <p className="text-xs text-gray-500">{new Date(notif.createdAt).toLocaleString()}</p>
              </div>
              {!notif.isRead && (
                <button
                  onClick={() => markRead.mutate(notif._id)}
                  className="p-1 rounded-full hover:bg-blue-200 text-blue-600 transition-colors"
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <p className="text-gray-500">No notifications.</p>
        )}
      </div>
    </div>
  );
}
