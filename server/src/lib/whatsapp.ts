import { WHATSAPP_NUMBER } from '../config/constants.js';

export function getWhatsAppLink(phone: string, message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encoded}`;
}

export function getReminderMessage(title: string, dueDate: string): string {
  return `Hi! Reminder: "${title}" is due for return on ${dueDate}. Please arrange to return it. Thank you!`;
}
