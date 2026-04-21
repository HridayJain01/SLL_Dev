import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function AdminNotifications() {
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState('');

  const sendReminders = useMutation({
    mutationFn: async () => {
      const res = await api.post('/notifications/send-reminders');
      return res.data;
    },
    onSuccess: (data) => toast.success(data.message),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to send reminders'),
  });

  const sendCustom = useMutation({
    mutationFn: async () => {
      await api.post('/notifications/send-custom', { userId, message });
    },
    onSuccess: () => {
      toast.success('Notification sent');
      setUserId('');
      setMessage('');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to send'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications Admin</h1>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-2">Automated Reminders</h2>
        <p className="text-gray-500 mb-4">Send due reminders to all users whose books are due within 3 days.</p>
        <button onClick={() => sendReminders.mutate()} disabled={sendReminders.isPending} className="bg-primary text-white px-4 py-2 rounded-lg">
          {sendReminders.isPending ? 'Sending...' : 'Trigger Due Reminders'}
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold mb-4">Send Custom Notification</h2>
        <div className="space-y-4 max-w-md">
          <div><label className="block text-sm mb-1">User ID</label><input value={userId} onChange={e => setUserId(e.target.value)} className="w-full border p-2 rounded" /></div>
          <div><label className="block text-sm mb-1">Message</label><textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full border p-2 rounded" rows={3} /></div>
          <button onClick={() => sendCustom.mutate()} disabled={sendCustom.isPending || !userId || !message} className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
}
