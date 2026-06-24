/**
 * Shared, email-client-safe HTML layout. Everything is table-based with inline
 * styles because that is the only thing that renders reliably across Gmail,
 * Outlook, Apple Mail, etc. Edit the brand tokens here to restyle every email.
 */

export const BRAND = {
  name: 'Star Learners Library',
  tagline: 'A library that grows with your child',
  primary: '#EF692B',
  primaryDark: '#D4571E',
  ink: '#26332D',
  muted: '#6B7280',
  bg: '#FAF7EF',
  card: '#FFFFFF',
  border: '#ECE7DB',
  supportEmail: process.env.SUPPORT_EMAIL || 'hello@starlearners.app',
};

export const APP_URL = (process.env.CLIENT_URL || 'https://starlearners.app').replace(/\/$/, '');

export function formatDate(value: Date | string | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export interface EmailItem {
  title: string;
  meta?: string;
}

/** Renders a list of books/items as styled rows for the email body. */
export function renderItemList(items: EmailItem[]): string {
  if (!items.length) return '';
  const rows = items
    .map(
      (it) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.border};font-size:15px;color:${BRAND.ink};font-weight:600;">
          ${escapeHtml(it.title)}
          ${it.meta ? `<div style="font-weight:400;color:${BRAND.muted};font-size:13px;margin-top:2px;">${escapeHtml(it.meta)}</div>` : ''}
        </td>
      </tr>`
    )
    .join('');
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;background:#FBFAF6;">
      ${rows}
    </table>`;
}

export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LayoutOptions {
  preheader?: string;
  heading: string;
  intro?: string;
  /** Pre-built, already-escaped HTML for the middle of the email. */
  bodyHtml?: string;
  cta?: { label: string; url: string };
  footerNote?: string;
}

export function emailLayout(opts: LayoutOptions): string {
  const { preheader, heading, intro, bodyHtml, cta, footerNote } = opts;

  const ctaHtml = cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
        <tr>
          <td style="border-radius:999px;background:${BRAND.primary};">
            <a href="${cta.url}" target="_blank"
              style="display:inline-block;padding:13px 30px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">
              ${escapeHtml(cta.label)}
            </a>
          </td>
        </tr>
      </table>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding:8px 4px 18px;">
              <a href="${APP_URL}" target="_blank" style="text-decoration:none;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;color:${BRAND.primary};">★ Star Learners</span>
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;color:${BRAND.ink};"> Library</span>
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:18px;padding:32px 30px;">
              <h1 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:23px;line-height:1.25;font-weight:800;color:${BRAND.ink};">${escapeHtml(heading)}</h1>
              ${intro ? `<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#3F4A45;">${intro}</p>` : ''}
              ${bodyHtml || ''}
              ${ctaHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 8px 8px;">
              ${footerNote ? `<p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">${footerNote}</p>` : ''}
              <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                Need help? Reach us at <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.primary};text-decoration:none;">${BRAND.supportEmail}</a>.
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${BRAND.muted};">
                © ${new Date().getFullYear()} ${BRAND.name}. ${escapeHtml(BRAND.tagline)}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
