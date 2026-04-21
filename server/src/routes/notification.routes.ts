import { Router } from 'express';
import { getMyNotifications, markRead, markAllRead, sendReminders, sendCustomNotification } from '../controllers/notification.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/me', protect, getMyNotifications);
router.put('/:id/read', protect, markRead);
router.put('/read-all', protect, markAllRead);
router.post('/send-reminders', protect, requireAdmin, sendReminders);
router.post('/send-custom', protect, requireAdmin, sendCustomNotification);

export default router;
