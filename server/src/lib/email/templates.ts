import { emailLayout, renderItemList, formatDate, escapeHtml, EmailItem, APP_URL, BRAND } from './layout.js';
import { MailContent } from './mailer.js';

/**
 * Every lifecycle email is built here. Each function returns a `MailContent`
 * ({ subject, html, text }). Keep the plain-text version in sync with the HTML
 * so text-only clients and spam filters stay happy.
 */

const firstName = (name: string) => (name || 'there').trim().split(' ')[0];

function plain(lines: (string | undefined | false)[]): string {
  return lines.filter(Boolean).join('\n\n');
}

function itemsText(items: EmailItem[]): string {
  return items.map((i) => `• ${i.title}${i.meta ? ` (${i.meta})` : ''}`).join('\n');
}

// ── 1. Order placed ──────────────────────────────────────────────────────────
export function orderPlacedEmail(name: string, items: EmailItem[]): MailContent {
  const count = items.length;
  return {
    subject: `Your order is confirmed — ${count} book${count === 1 ? '' : 's'} on the way 📚`,
    html: emailLayout({
      preheader: `We've reserved ${count} book${count === 1 ? '' : 's'} for you.`,
      heading: `Order confirmed, ${escapeHtml(firstName(name))}!`,
      intro: `We've reserved the following for your child. Your return date starts the day they reach you — we'll confirm it in the delivery email.`,
      bodyHtml: renderItemList(items),
      cta: { label: 'View my books', url: `${APP_URL}/dashboard/my-books` },
      footerNote: 'Our delivery partner will be in touch with pickup and drop-off details.',
    }),
    text: plain([
      `Order confirmed, ${firstName(name)}!`,
      `We've reserved these books for you:`,
      itemsText(items),
      `Your return date starts once they are delivered — we'll confirm it then.`,
      `View your books: ${APP_URL}/dashboard/my-books`,
    ]),
  };
}

// ── 2. Single book assigned (admin assigned) ─────────────────────────────────
export function bookAssignedEmail(name: string, title: string): MailContent {
  return {
    subject: `"${title}" has been added to your box`,
    html: emailLayout({
      preheader: `${title} is reserved for you.`,
      heading: `A new book is on its way! 🎉`,
      intro: `<strong>${escapeHtml(title)}</strong> has been assigned to your account. We'll confirm your return date once it's delivered.`,
      cta: { label: 'View my books', url: `${APP_URL}/dashboard/my-books` },
    }),
    text: plain([
      `Hi ${firstName(name)},`,
      `"${title}" has been assigned to your account. We'll confirm your return date once it's delivered.`,
      `View your books: ${APP_URL}/dashboard/my-books`,
    ]),
  };
}

// ── 2b. Order delivered — this is where the loan period starts ───────────────
export function orderDeliveredEmail(name: string, items: EmailItem[], dueDate: Date | string): MailContent {
  const due = formatDate(dueDate);
  const count = items.length;
  return {
    subject: `Delivered! ${count} book${count === 1 ? '' : 's'} — due back ${due} 📦`,
    html: emailLayout({
      preheader: `Your book${count === 1 ? '' : 's'} arrived. Due back ${due}.`,
      heading: `Your box has arrived, ${escapeHtml(firstName(name))}!`,
      intro: `${count === 1 ? 'It is' : 'They are'} all yours until <strong>${due}</strong>. Request a pickup from your dashboard whenever you're done — early is fine.`,
      bodyHtml: renderItemList(items),
      cta: { label: 'View my books', url: `${APP_URL}/dashboard/my-books` },
      footerNote: 'Your reading time starts today, not the day you ordered.',
    }),
    text: plain([
      `Hi ${firstName(name)},`,
      `Your books have been delivered and are due back on ${due}:`,
      itemsText(items),
      `Request a pickup any time: ${APP_URL}/dashboard/my-books`,
    ]),
  };
}

// ── 3. Due / return reminder ─────────────────────────────────────────────────
export function dueReminderEmail(name: string, items: EmailItem[], dueDate: Date | string): MailContent {
  const due = formatDate(dueDate);
  const count = items.length;
  return {
    subject: `Reminder: ${count} book${count === 1 ? '' : 's'} due on ${due} ⏰`,
    html: emailLayout({
      preheader: `Please arrange to return your book${count === 1 ? '' : 's'} by ${due}.`,
      heading: `A gentle return reminder`,
      intro: `Hi ${escapeHtml(firstName(name))}, the following ${count === 1 ? 'book is' : 'books are'} due on <strong>${due}</strong>. You can request a pickup any time from your dashboard.`,
      bodyHtml: renderItemList(items),
      cta: { label: 'Request a return pickup', url: `${APP_URL}/dashboard/my-books` },
      footerNote: 'Returning on time keeps your monthly cycle free for new books.',
    }),
    text: plain([
      `Hi ${firstName(name)},`,
      `These books are due on ${due}:`,
      itemsText(items),
      `Request a return pickup: ${APP_URL}/dashboard/my-books`,
    ]),
  };
}

// ── 4. Return pickup requested (confirmation) ────────────────────────────────
export function returnRequestedEmail(name: string, items: EmailItem[]): MailContent {
  const count = items.length;
  return {
    subject: `Pickup requested for ${count} book${count === 1 ? '' : 's'} 🚚`,
    html: emailLayout({
      preheader: `We've logged your return request.`,
      heading: `Return pickup requested`,
      intro: `Thanks ${escapeHtml(firstName(name))}! We've logged a pickup for the following ${count === 1 ? 'book' : 'books'}. Our delivery partner will collect ${count === 1 ? 'it' : 'them'} soon.`,
      bodyHtml: renderItemList(items),
      footerNote: 'Please keep the books ready. You will get another email once a delivery partner is assigned.',
    }),
    text: plain([
      `Thanks ${firstName(name)}!`,
      `We've logged a return pickup for:`,
      itemsText(items),
      `Our delivery partner will collect them soon.`,
    ]),
  };
}

// ── 5. Order returned (completed) ────────────────────────────────────────────
export function orderReturnedEmail(name: string, items: EmailItem[]): MailContent {
  const count = items.length;
  return {
    subject: `Return confirmed — thanks for reading! ✅`,
    html: emailLayout({
      preheader: `We've received your returned book${count === 1 ? '' : 's'}.`,
      heading: `Return confirmed 🎉`,
      intro: `We've received ${count === 1 ? 'your book' : `all ${count} books`} back. Your cycle quota has been freed up — ready to pick your next reads?`,
      bodyHtml: renderItemList(items),
      cta: { label: 'Browse the library', url: `${APP_URL}/library` },
      footerNote: 'We hope your little one enjoyed them. Happy reading!',
    }),
    text: plain([
      `Hi ${firstName(name)},`,
      `We've received these books back:`,
      itemsText(items),
      `Browse for more: ${APP_URL}/library`,
    ]),
  };
}

// ── 6. Delivery person assigned ──────────────────────────────────────────────
export function deliveryAssignedEmail(
  name: string,
  opts: { type: 'DELIVERY' | 'PICKUP'; personName: string; personPhone?: string; items: EmailItem[]; eta?: string }
): MailContent {
  const isPickup = opts.type === 'PICKUP';
  const action = isPickup ? 'pickup' : 'delivery';
  const contact = opts.personPhone
    ? `<strong>${escapeHtml(opts.personName)}</strong> (${escapeHtml(opts.personPhone)})`
    : `<strong>${escapeHtml(opts.personName)}</strong>`;
  return {
    subject: `${isPickup ? 'Pickup' : 'Delivery'} partner assigned 🚚`,
    html: emailLayout({
      preheader: `${opts.personName} will handle your ${action}.`,
      heading: `Your ${action} partner is on the way`,
      intro: `${contact} has been assigned to ${isPickup ? 'collect' : 'deliver'} your book${opts.items.length === 1 ? '' : 's'}.${opts.eta ? ` Expected ${action} window: <strong>${escapeHtml(opts.eta)}</strong>.` : ''}`,
      bodyHtml: renderItemList(opts.items),
      footerNote: isPickup
        ? 'Please keep the books packed and ready for collection.'
        : 'Please ensure someone is available to receive the delivery.',
    }),
    text: plain([
      `Hi ${firstName(name)},`,
      `${opts.personName}${opts.personPhone ? ` (${opts.personPhone})` : ''} has been assigned to ${isPickup ? 'collect' : 'deliver'} your books.`,
      opts.eta && `Expected ${action} window: ${opts.eta}.`,
      itemsText(opts.items),
    ]),
  };
}

// ── 7. Marketing / broadcast ─────────────────────────────────────────────────
export function marketingEmail(
  name: string,
  opts: { subject: string; heading: string; body: string; cta?: { label: string; url: string }; imageUrl?: string }
): MailContent {
  const paragraphs = opts.body
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#3F4A45;">${escapeHtml(line)}</p>`
    )
    .join('');

  const image = opts.imageUrl
    ? `<img src="${escapeHtml(opts.imageUrl)}" alt="" width="100%" style="display:block;width:100%;max-width:500px;border-radius:12px;margin:0 0 18px;" />`
    : '';

  return {
    subject: opts.subject,
    html: emailLayout({
      preheader: opts.subject,
      heading: opts.heading,
      intro: `Hi ${escapeHtml(firstName(name))},`,
      bodyHtml: image + paragraphs,
      cta: opts.cta && opts.cta.url ? { label: opts.cta.label, url: opts.cta.url } : undefined,
      footerNote: `You're receiving this because you have a ${BRAND.name} account. To stop promotional emails, update your preferences at ${APP_URL}/dashboard/preferences.`,
    }),
    text: plain([
      `Hi ${firstName(name)},`,
      opts.body,
      opts.cta && opts.cta.url && `${opts.cta.label}: ${opts.cta.url}`,
      `Manage email preferences: ${APP_URL}/dashboard/preferences`,
    ]),
  };
}
