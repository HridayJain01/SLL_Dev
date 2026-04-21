"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_js_1 = require("../controllers/notification.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const requireAdmin_js_1 = require("../middleware/requireAdmin.js");
const router = (0, express_1.Router)();
router.get('/me', auth_js_1.protect, notification_controller_js_1.getMyNotifications);
router.put('/:id/read', auth_js_1.protect, notification_controller_js_1.markRead);
router.put('/read-all', auth_js_1.protect, notification_controller_js_1.markAllRead);
router.post('/send-reminders', auth_js_1.protect, requireAdmin_js_1.requireAdmin, notification_controller_js_1.sendReminders);
router.post('/send-custom', auth_js_1.protect, requireAdmin_js_1.requireAdmin, notification_controller_js_1.sendCustomNotification);
exports.default = router;
//# sourceMappingURL=notification.routes.js.map