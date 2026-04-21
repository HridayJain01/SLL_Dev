"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWhatsAppLink = getWhatsAppLink;
exports.getReminderMessage = getReminderMessage;
function getWhatsAppLink(phone, message) {
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encoded}`;
}
function getReminderMessage(title, dueDate) {
    return `Hi! Reminder: "${title}" is due for return on ${dueDate}. Please arrange to return it. Thank you!`;
}
//# sourceMappingURL=whatsapp.js.map