import { sendEmail, EMAIL_ENABLED, MailContent } from './mailer.js';
import { EmailItem } from './layout.js';
import {
  orderPlacedEmail,
  adminOrderPlacedEmail,
  bookAssignedEmail,
  backInStockEmail,
  orderDeliveredEmail,
  dueReminderEmail,
  returnRequestedEmail,
  orderReturnedEmail,
  deliveryAssignedEmail,
  marketingEmail,
  passwordResetEmail,
} from './templates.js';

export { EMAIL_ENABLED } from './mailer.js';
export type { EmailItem } from './layout.js';

/**
 * Public, intention-revealing email API used across the app.
 *
 * Every helper is best-effort: it resolves to a boolean and never throws, so a
 * controller can `void emailService.orderPlaced(...)` without blocking or
 * risking the HTTP response if the mail provider is down.
 */
export const emailService = {
  orderPlaced(to: string, name: string, items: EmailItem[]) {
    return send(to, orderPlacedEmail(name, items));
  },

  /** To the library team, with the printable packing slip attached. */
  adminOrderPlaced(to: string, ...args: Parameters<typeof adminOrderPlacedEmail>) {
    return send(to, adminOrderPlacedEmail(...args));
  },

  bookAssigned(to: string, name: string, title: string) {
    return send(to, bookAssignedEmail(name, title));
  },

  backInStock(to: string, name: string, title: string, bookId: string) {
    return send(to, backInStockEmail(name, title, bookId));
  },

  /** Sent when the box is handed over — the email that carries the due date. */
  orderDelivered(to: string, name: string, items: EmailItem[], dueDate: Date | string) {
    return send(to, orderDeliveredEmail(name, items, dueDate));
  },

  dueReminder(to: string, name: string, items: EmailItem[], dueDate: Date | string) {
    return send(to, dueReminderEmail(name, items, dueDate));
  },

  returnRequested(to: string, name: string, items: EmailItem[]) {
    return send(to, returnRequestedEmail(name, items));
  },

  orderReturned(to: string, name: string, items: EmailItem[]) {
    return send(to, orderReturnedEmail(name, items));
  },

  deliveryAssigned(
    to: string,
    name: string,
    opts: { type: 'DELIVERY' | 'PICKUP'; personName: string; personPhone?: string; items: EmailItem[]; eta?: string }
  ) {
    return send(to, deliveryAssignedEmail(name, opts));
  },

  passwordReset(to: string, name: string, resetUrl: string, ttlMinutes: number) {
    return send(to, passwordResetEmail(name, resetUrl, ttlMinutes));
  },

  marketing(
    to: string,
    name: string,
    opts: { subject: string; heading: string; body: string; cta?: { label: string; url: string }; imageUrl?: string }
  ) {
    return send(to, marketingEmail(name, opts));
  },
};

function send(to: string, content: MailContent): Promise<boolean> {
  return sendEmail(to, content).catch((err) => {
    console.error('[email] unexpected send error:', (err as Error).message);
    return false;
  });
}

export const isEmailEnabled = () => EMAIL_ENABLED;
