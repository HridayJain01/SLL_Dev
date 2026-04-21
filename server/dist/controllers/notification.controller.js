"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyNotifications = getMyNotifications;
exports.markRead = markRead;
exports.markAllRead = markAllRead;
exports.sendReminders = sendReminders;
exports.sendCustomNotification = sendCustomNotification;
const zod_1 = require("zod");
const Notification_js_1 = __importDefault(require("../models/Notification.js"));
const Borrow_js_1 = __importDefault(require("../models/Borrow.js"));
const constants_js_1 = require("../config/constants.js");
async function getMyNotifications(req, res, next) {
    try {
        const notifications = await Notification_js_1.default.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json({ notifications });
    }
    catch (err) {
        next(err);
    }
}
async function markRead(req, res, next) {
    try {
        const notification = await Notification_js_1.default.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true }, { new: true });
        if (!notification)
            return res.status(404).json({ message: 'Notification not found' });
        res.json({ notification });
    }
    catch (err) {
        next(err);
    }
}
async function markAllRead(req, res, next) {
    try {
        await Notification_js_1.default.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        res.json({ message: 'All notifications marked as read' });
    }
    catch (err) {
        next(err);
    }
}
async function sendReminders(_req, res, next) {
    try {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + constants_js_1.REMINDER_DAYS_BEFORE);
        const borrows = await Borrow_js_1.default.find({
            status: 'ACTIVE',
            dueDate: { $lte: reminderDate },
        }).populate('bookId', 'title');
        const notifications = [];
        for (const borrow of borrows) {
            const book = borrow.bookId;
            notifications.push({
                userId: borrow.userId,
                type: 'DUE_REMINDER',
                message: `Reminder: "${book.title}" is due on ${borrow.dueDate.toLocaleDateString()}. Please return it on time.`,
            });
        }
        if (notifications.length > 0) {
            await Notification_js_1.default.insertMany(notifications);
        }
        res.json({ message: `${notifications.length} reminder(s) sent` });
    }
    catch (err) {
        next(err);
    }
}
async function sendCustomNotification(req, res, next) {
    try {
        const data = zod_1.z.object({
            userId: zod_1.z.string().min(1),
            message: zod_1.z.string().min(1),
        }).parse(req.body);
        const notification = await Notification_js_1.default.create({
            userId: data.userId,
            type: 'GENERAL',
            message: data.message,
        });
        res.status(201).json({ notification });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        next(err);
    }
}
//# sourceMappingURL=notification.controller.js.map