/**
 * Outbound WhatsApp via the Meta WhatsApp Cloud API.
 *
 * WhatsApp only lets a business start a conversation with a pre-approved
 * template, so every message here is a template send. Create these in
 * WhatsApp Manager (Message templates) with exactly these names and body
 * variables, in the language set by WHATSAPP_TEMPLATE_LANG (default "en"):
 *
 *   order_placed     Hi {{1}}, we've received your order {{2}} for {{3}} item(s).
 *                    We'll let you know when it's on the way.
 *   return_reminder  Hi {{1}}, a reminder that your {{2}} item(s) are due back on {{3}}.
 *                    You can request a pickup from My Account > Orders.
 *
 *   WHATSAPP_TOKEN            permanent access token (System User)
 *   WHATSAPP_PHONE_NUMBER_ID  the sending number's id, not the number itself
 *
 * Off until both are set: it logs what it would have sent, like the mailer.
 * Never throws, so callers can fire and forget.
 */

const API_VERSION = 'v21.0';

let warned = false;

/** Indian numbers are stored as typed, so "98765 43210" and "+91-98765-43210" both appear. */
export function toWhatsAppNumber(phone?: string | null): string | null {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return null;
}

async function sendTemplate(phone: string | undefined, template: string, params: string[]): Promise<boolean> {
  const to = toWhatsAppNumber(phone);
  if (!to) return false;

  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TEMPLATE_LANG } = process.env;
  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    if (!warned) {
      console.warn('[whatsapp] not configured — set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID to send.');
      warned = true;
    }
    console.info(`[whatsapp:dev] would send ${template} → ${to}`);
    return false;
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: template,
          language: { code: WHATSAPP_TEMPLATE_LANG || 'en' },
          components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
        },
      }),
    });
    if (!res.ok) {
      console.error(`[whatsapp] ${template} to ${to} failed: ${res.status} ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[whatsapp] ${template} to ${to} failed:`, (err as Error).message);
    return false;
  }
}

export const whatsapp = {
  orderPlaced(phone: string | undefined, name: string, orderRef: string, itemCount: number) {
    return sendTemplate(phone, 'order_placed', [name, orderRef, String(itemCount)]);
  },
  returnReminder(phone: string | undefined, name: string, itemCount: number, dueDate: string) {
    return sendTemplate(phone, 'return_reminder', [name, String(itemCount), dueDate]);
  },
};
