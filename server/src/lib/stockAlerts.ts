import { Types } from 'mongoose';
import Book from '../models/Book.js';
import Borrow from '../models/Borrow.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { emailService } from './email/index.js';

/**
 * Tells everyone waiting on these titles that a copy is free, then drops them
 * from the list — one alert per request, not one per return.
 *
 * Call after anything that can free a copy (a return, more copies added).
 * Never throws: the caller's own write has already happened and must not be
 * reported as failed because an alert could not go out.
 */
export async function notifyBackInStock(bookIds: (Types.ObjectId | string)[]): Promise<void> {
  const ids = [...new Set(bookIds.map(String))];
  for (const id of ids) {
    try {
      const book = await Book.findById(id).select('title totalCopies').lean();
      if (!book) continue;
      const out = await Borrow.countDocuments({ bookId: book._id, status: { $ne: 'RETURNED' } });
      if (out >= book.totalCopies) continue;

      const waiting = await User.find({ stockAlerts: book._id }).select('name email').lean();
      if (!waiting.length) continue;

      // Pull exactly the members we are about to tell, so someone who asks in
      // the meantime stays on the list for the next copy.
      await User.updateMany({ _id: { $in: waiting.map((u) => u._id) } }, { $pull: { stockAlerts: book._id } });
      await Notification.insertMany(
        waiting.map((u) => ({
          userId: u._id,
          type: 'BACK_IN_STOCK' as const,
          message: `"${book.title}" is available again — add it to your box while it's free.`,
        }))
      );
      for (const u of waiting) {
        if (u.email) void emailService.backInStock(u.email, u.name, book.title, String(book._id));
      }
    } catch (err) {
      console.error('[stock-alerts] could not notify for book', id, (err as Error).message);
    }
  }
}
