import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bell, Check } from 'lucide-react';
import api from '@/lib/axios';
import { INotification } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
  AccountButton,
  AccountPage,
  AccountEmptyState,
  AccountPageHeader,
} from '@/components/account/AccountCard';

/** Member notifications — `GET /notifications/me` with read/read-all actions. */
export default function AccountNotifications() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/me');
      return res.data.notifications as INotification[];
    },
    enabled: !!user,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not update it'),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All caught up');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Could not update them'),
  });

  const unread = (data ?? []).filter((notification) => !notification.isRead).length;

  return (
    <AccountPage>
      <AccountPageHeader
        title="Notifications"
        subtitle={
          unread > 0 ? `${unread} unread update${unread === 1 ? '' : 's'}` : 'You are all caught up.'
        }
        action={
          unread > 0 ? (
            <AccountButton onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              Mark all as read
            </AccountButton>
          ) : undefined
        }
      />

      {isLoading ? (
        <p className="font-body text-[14px] text-slate-muted">Loading your notifications…</p>
      ) : (data ?? []).length === 0 ? (
        <AccountEmptyState
          icon={<Bell className="h-[22px] w-[22px]" strokeWidth={1.5} />}
          title="Nothing here yet"
          body="Order updates, delivery news and due-date reminders will show up here."
        />
      ) : (
        <div className="space-y-[12px]">
          {data?.map((notification) => (
            <div
              key={notification._id}
              className={`flex items-start justify-between gap-4 rounded-[16px] border p-[18px] ${
                notification.isRead
                  ? 'border-[#f3f4f6] bg-[#f9fafb]'
                  : 'border-[#a7d9d2] bg-[#f0faf8]'
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`font-body text-[14px] leading-[20px] ${
                    notification.isRead ? 'text-[#4b5563]' : 'font-semibold text-night'
                  }`}
                >
                  {notification.message}
                </p>
                <p className="pt-[4px] font-body text-[12px] leading-[16px] text-slate-muted">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {!notification.isRead && (
                <button
                  type="button"
                  onClick={() => markRead.mutate(notification._id)}
                  title="Mark as read"
                  aria-label="Mark as read"
                  className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-full text-lagoon-deep transition-colors hover:bg-white sm:h-[30px] sm:w-[30px]"
                >
                  <Check className="h-[16px] w-[16px]" strokeWidth={1.8} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </AccountPage>
  );
}
