import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Notification from '../models/Notification.js';
import Borrow from '../models/Borrow.js';
import { AuthRequest } from '../middleware/auth.js';
import { REMINDER_DAYS_BEFORE } from '../config/constants.js';

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
    }).populate('bookId', 'title');

    const notifications = [];
    for (const borrow of borrows) {
      const book = borrow.bookId as any;
      notifications.push({
        userId: borrow.userId,
        type: 'DUE_REMINDER' as const,
        message: `Reminder: "${book.title}" is due on ${borrow.dueDate.toLocaleDateString()}. Please return it on time.`,
      });
    }

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.json({ message: `${notifications.length} reminder(s) sent` });
  } catch (err) { next(err); }
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
