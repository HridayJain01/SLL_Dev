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
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ notifications });
  } catch (err) { next(err); }
}

export async function markRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification });
  } catch (err) { next(err); }
}

export async function markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
}

export async function sendReminders(_req: Request, res: Response, next: NextFunction) {
  try {
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + REMINDER_DAYS_BEFORE);

    const borrows = await Borrow.find({
      status: 'ACTIVE',
      dueDate: { $lte: reminderDate },
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
      notifications.push({
        userId: member._id,
        type: 'DUE_REMINDER' as const,
        message: `Reminder: "${book.title}" is due on ${borrow.dueDate.toLocaleDateString()}. Please return it on time.`,
      });

      const key = String(member._id);
      const entry = byUser.get(key);
      if (entry) {
        entry.items.push({ title: book.title });
        if (borrow.dueDate < entry.earliestDue) entry.earliestDue = borrow.dueDate;
      } else {
        byUser.set(key, {
          name: member.name,
          email: member.email,
          items: [{ title: book.title }],
          earliestDue: borrow.dueDate,
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

    res.json({
      message: `${notifications.length} reminder(s) sent`,
      emails: emailed,
    });
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
