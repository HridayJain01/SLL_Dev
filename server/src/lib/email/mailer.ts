import nodemailer, { Transporter } from 'nodemailer';

/**
 * Transport layer for outbound email.
 *
 * Configuration is read from environment variables so the same code works with
 * any SMTP provider (Gmail app password, Mailgun, Postmark, Amazon SES, etc.):
 *
 *   SMTP_HOST        smtp.example.com
 *   SMTP_PORT        587            (default 587)
 *   SMTP_SECURE      true|false     (true for port 465)
 *   SMTP_USER        login / api key
 *   SMTP_PASS        password / api secret
 *   EMAIL_FROM       no-reply@starlearners.app
 *   EMAIL_FROM_NAME  Star Learners Library
 *
 * When SMTP is not configured the mailer degrades gracefully: it logs what it
 * *would* have sent instead of throwing, so local development and tests never
 * fail because of missing mail credentials.
 */

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  EMAIL_FROM_NAME,
} = process.env;

export const EMAIL_ENABLED = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const FROM_NAME = EMAIL_FROM_NAME || 'Star Learners Library';
const FROM_ADDRESS = EMAIL_FROM || SMTP_USER || 'no-reply@starlearners.app';
const FROM = `"${FROM_NAME}" <${FROM_ADDRESS}>`;

let transporter: Transporter | null = null;
let warned = false;

function getTransporter(): Transporter | null {
  if (!EMAIL_ENABLED) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ? parseInt(SMTP_PORT, 10) : 587,
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporter;
}

export interface MailContent {
  subject: string;
  html: string;
  text: string;
  attachments?: { filename: string; content: Buffer; contentType: string }[];
}

/**
 * Sends a single email. Never throws — returns `true` on success, `false`
 * otherwise — so callers can fire-and-forget without risking the request flow.
 */
export async function sendEmail(to: string, content: MailContent): Promise<boolean> {
  if (!to) return false;
  const tx = getTransporter();

  if (!tx) {
    if (!warned) {
      console.warn(
        '[email] SMTP is not configured — emails will be logged, not delivered. ' +
          'Set SMTP_HOST, SMTP_USER and SMTP_PASS to enable real sending.'
      );
      warned = true;
    }
    console.info(`[email:dev] would send → ${to} :: ${content.subject}`);
    // Locally, print the body too, so links in it (password resets) can actually
    // be followed. Only on an explicit 'development' -- not "anything but
    // production" -- so a host that forgets to set NODE_ENV fails closed rather
    // than writing live reset tokens into its logs. And never on Vercel
    // (which sets VERCEL=1 everywhere it runs), since NODE_ENV there is a
    // dashboard setting that has already been found set to 'development'.
    if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
      console.info(content.text.replace(/^/gm, '    '));
    }
    return false;
  }

  try {
    await tx.sendMail({
      from: FROM,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: content.attachments,
    });
    return true;
  } catch (err) {
    console.error(`[email] failed to send "${content.subject}" to ${to}:`, (err as Error).message);
    return false;
  }
}

/**
 * Sends the same content to many recipients sequentially (gentle on provider
 * rate limits). Use the per-recipient helpers in `index.ts` when the body needs
 * personalising. Returns a tally of successes and failures.
 */
export async function sendBulkEmail(
  recipients: string[],
  build: (to: string) => MailContent
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  for (const to of recipients) {
    const ok = await sendEmail(to, build(to));
    if (ok) sent++;
    else failed++;
  }
  return { sent, failed };
}
