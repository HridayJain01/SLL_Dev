import { getPlanLabel } from '@/lib/plans';

export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919XXXXXXXXX';

export const getMembershipWhatsAppLink = (plan: string, months: number, price: number) => {
  const planLabel = getPlanLabel(plan);
  const msg = encodeURIComponent(
    `Hi! I'd like to buy the ${planLabel} plan (${months} month${months > 1 ? 's' : ''}) for ₹${price}. Please share payment details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
};

export const getReminderWhatsAppLink = (phone: string, title: string, due: string) => {
  const msg = encodeURIComponent(
    `Hi! Reminder: "${title}" is due for return on ${due}. Please arrange to return it. Thank you!`
  );
  return `https://wa.me/${phone}?text=${msg}`;
};
