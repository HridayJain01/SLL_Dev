export const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '919XXXXXXXXX';

export const getMembershipWhatsAppLink = (plan: string, months: number, price: number) => {
  const msg = encodeURIComponent(
    `Hi! I'd like to buy the ${plan} Plan (${months} month(s)) for ₹${price}. Please share payment details.`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
};

export const getReminderWhatsAppLink = (phone: string, title: string, due: string) => {
  const msg = encodeURIComponent(
    `Hi! Reminder: "${title}" is due for return on ${due}. Please arrange to return it. Thank you!`
  );
  return `https://wa.me/${phone}?text=${msg}`;
};
