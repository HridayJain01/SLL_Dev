import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { INotification } from '@/types';

/** Ask once for permission, then register this device for web push. */
async function enablePush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if ((await Notification.requestPermission()) !== 'granted') return;
    const { publicKey } = (await api.get('/notifications/push-key')).data;
    if (!publicKey) return;
    const reg = await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey }));
    await api.post('/notifications/push-subscribe', sub.toJSON());
  } catch (err) {
    console.warn('[push] not enabled', err);
  }
}

/** On logout: stop pushes to this device, so the next person here doesn't get them. */
export async function disablePush() {
  try {
    const sub = await (await navigator.serviceWorker?.getRegistration())?.pushManager.getSubscription();
    if (!sub) return;
    await api.post('/notifications/push-unsubscribe', { endpoint: sub.endpoint });
    await sub.unsubscribe();
  } catch (err) {
    console.warn('[push] unsubscribe failed', err);
  }
}

/**
 * Toasts every new notification while the site is open. When it's closed or in
 * the background, the server's web push (public/sw.js) shows it instead.
 * Shares the ['notifications'] query with the bell badge.
 */
export default function NotificationPopups() {
  const user = useAuthStore((s) => s.user);
  const seen = useRef<Set<string> | null>(null);

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications/me')).data.notifications as INotification[],
    enabled: !!user,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (user) void enablePush();
    seen.current = null; // new login: don't replay that account's backlog
  }, [user]);

  useEffect(() => {
    if (!data) return;
    // First load only records what's already there; popups are for what arrives after.
    if (!seen.current) {
      seen.current = new Set(data.map((n) => n._id));
      return;
    }
    for (const n of data) {
      if (seen.current.has(n._id)) continue;
      seen.current.add(n._id);
      if (n.isRead) continue;
      toast(n.message);
    }
  }, [data]);

  return null;
}
