import { Router } from 'express';
import { getMyMembership, createMembership, updateMembership } from '../controllers/membership.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/me', protect, getMyMembership);
router.post('/', protect, requireAdmin, createMembership);
router.put('/:id', protect, requireAdmin, updateMembership);

export default router;
