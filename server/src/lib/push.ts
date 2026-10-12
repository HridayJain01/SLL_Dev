import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
const enabled = !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
if (enabled) webpush.setVapidDetails(VAPID_SUBJECT || 'mailto:hello@example.com', VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);

/** Push each notification to every device its member subscribed. Never throws. */
export async function pushNotifications(items: { userId: unknown; message: string }[]) {
  if (!enabled || items.length === 0) return;
  try {
    const subs = await PushSubscription.find({ userId: { $in: [...new Set(items.map((i) => String(i.userId)))] } });
    await Promise.all(
      items.flatMap((item) =>
        subs
          .filter((s) => String(s.userId) === String(item.userId))
          .map((s) =>
            webpush
              .sendNotification(s.toObject(), JSON.stringify({ title: 'Star Learners Library', body: item.message }))
              .catch((err) => {
                // Gone/expired subscription: forget the device.
                if (err.statusCode === 404 || err.statusCode === 410) return PushSubscription.deleteOne({ _id: s._id });
              })
          )
      )
    );
  } catch (err) {
    console.error('[push] failed', err);
  }
}
