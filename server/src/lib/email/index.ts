import { sendEmail, EMAIL_ENABLED, MailContent } from './mailer.js';
import { EmailItem } from './layout.js';
import {
  orderPlacedEmail,
  bookAssignedEmail,
  dueReminderEmail,
  returnRequestedEmail,
  orderReturnedEmail,
  deliveryAssignedEmail,
  marketingEmail,
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
  orderPlaced(to: string, name: string, items: EmailItem[], dueDate: Date | string) {
    return send(to, orderPlacedEmail(name, items, dueDate));
  },

  bookAssigned(to: string, name: string, title: string, dueDate: Date | string) {
    return send(to, bookAssignedEmail(name, title, dueDate));
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
