import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Notification from '../models/Notification.js';
import Borrow from '../models/Borrow.js';
import User from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import { REMINDER_DAYS_BEFORE } from '../config/constants.js';
import { emailService, EmailItem } from '../lib/email/index.js';

export async function getMyNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notifications = await Notification.find({ userId: req.user!._id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) { next(err); }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (err) { next(err); }
}

export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await Notification.updateMany({ userId: req.user!._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
}

/**
 * Send due-date reminders for every loan approaching its return date.
 *
 * Shared by the admin "send reminders" button and the daily cron, so the two can
 * never drift. Loans already reminded today are skipped: the cron may be retried
 * or fire twice, and a member must not get the same reminder twice in a day.
 */
export async function runDueReminders(): Promise<{ notifications: number; emails: number }> {
  {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + REMINDER_DAYS_BEFORE);

    // `$ne: null` matters: a borrow that has not been delivered yet has no due
    // date, and a missing field would otherwise compare as lower than any date
    // and pull undelivered orders into the reminder run.
    // Midnight today: one reminder per loan per day, however often this runs.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const borrows = await Borrow.find({
      status: 'ACTIVE',
      dueDate: { $ne: null, $lte: reminderDate },
      $or: [{ remindedAt: { $exists: false } }, { remindedAt: { $lt: startOfToday } }],
    })
      .populate('bookId', 'title')
      .populate('userId', 'name email');

    // One in-app notification per book, but a single grouped email per member.
    const notifications: any[] = [];
    const byUser = new Map<
      string,
      { name: string; email?: string; items: EmailItem[]; earliestDue: Date }
    >();

    for (const borrow of borrows) {
      const book = borrow.bookId as any;
      const member = borrow.userId as any;
      // The query already excludes undelivered loans; this narrows the type and
      // keeps the loop honest if that filter ever changes.
      const dueDate = borrow.dueDate;
      if (!dueDate) continue;

      notifications.push({
        userId: member._id,
        type: 'DUE_REMINDER' as const,
        message: `Reminder: "${book.title}" is due on ${dueDate.toLocaleDateString()}. Please return it on time.`,
      });

      const key = String(member._id);
      const entry = byUser.get(key);
      if (entry) {
        entry.items.push({ title: book.title });
        if (dueDate < entry.earliestDue) entry.earliestDue = dueDate;
      } else {
        byUser.set(key, {
          name: member.name,
          email: member.email,
          items: [{ title: book.title }],
          earliestDue: dueDate,
        });
      }
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    let emailed = 0;
    for (const entry of byUser.values()) {
      if (!entry.email) continue;
      void emailService.dueReminder(entry.email, entry.name, entry.items, entry.earliestDue);
      emailed++;
    }

    // Stamped only after the work above, so a crash mid-run leaves the loans
    // eligible for the next attempt rather than silently skipping them.
    if (borrows.length > 0) {
      await Borrow.updateMany(
        { _id: { $in: borrows.map((borrow) => borrow._id) } },
        { remindedAt: new Date() }
      );
    }

    return { notifications: notifications.length, emails: emailed };
  }
}

/** Admin-triggered run, from the notifications screen. */
export async function sendReminders(_req: Request, res: Response, next: NextFunction) {
  try {
    const result = await runDueReminders();
    res.json({
      message: `${result.notifications} reminder(s) sent`,
      emails: result.emails,
    });
  } catch (err) { next(err); }
}

/**
 * The same run, on a daily schedule from Vercel Cron.
 *
 * Cron requests carry no session cookie, so this cannot sit behind `protect`.
 * Vercel sends `Authorization: Bearer $CRON_SECRET` when that variable is set;
 * without the variable configured the route stays shut rather than open, so a
 * missing environment variable can never expose it.
 */
export async function cronDueReminders(req: Request, res: Response, next: NextFunction) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return res.status(503).json({ message: 'CRON_SECRET is not configured' });
  }
  if (req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ message: 'Not authorised' });
  }

  try {
    const result = await runDueReminders();
    console.log(`[cron] due reminders: ${result.notifications} notification(s), ${result.emails} email(s)`);
    res.json({ ok: true, ...result });
  } catch (err) { next(err); }
}

/**
 * Admin marketing broadcast. Sends a templated promotional email to an audience
 * segment. Optionally also drops an in-app notification for each recipient.
 */
export async function sendMarketingBroadcast(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z
      .object({
        subject: z.string().min(1),
        heading: z.string().min(1),
        body: z.string().min(1),
        ctaLabel: z.string().optional(),
        ctaUrl: z.string().url().optional(),
        imageUrl: z.string().url().optional(),
        audience: z.enum(['ALL', 'ACTIVE', 'PENDING']).default('ALL'),
        alsoNotifyInApp: z.boolean().default(false),
      })
      .parse(req.body);

    const filter: any = { role: 'USER' };
    if (data.audience === 'ACTIVE') filter.status = 'ACTIVE';
    else if (data.audience === 'PENDING') filter.status = 'PENDING';

    const users = await User.find(filter).select('name email');
    const recipients = users.filter((u) => u.email);

    const cta = data.ctaLabel && data.ctaUrl ? { label: data.ctaLabel, url: data.ctaUrl } : undefined;

    let sent = 0;
    for (const user of recipients) {
      const ok = await emailService.marketing(user.email, user.name, {
        subject: data.subject,
        heading: data.heading,
        body: data.body,
        cta,
        imageUrl: data.imageUrl,
      });
      if (ok) sent++;
    }

    if (data.alsoNotifyInApp && recipients.length > 0) {
      await Notification.insertMany(
        recipients.map((user) => ({
          userId: user._id,
          type: 'GENERAL' as const,
          message: data.heading,
        }))
      );
    }

    res.json({
      message: `Marketing broadcast queued for ${recipients.length} member(s)`,
      audience: data.audience,
      recipients: recipients.length,
      delivered: sent,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}

export async function sendCustomNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const data = z.object({
      userId: z.string().min(1),
      message: z.string().min(1),
    }).parse(req.body);

    const notification = await Notification.create({
      userId: data.userId,
      type: 'GENERAL',
      message: data.message,
    });

    res.status(201).json({ notification });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    next(err);
  }
}
