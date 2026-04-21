import { Router } from 'express';
import { listBorrows, assignBook, markReturned, listOverdue } from '../controllers/borrow.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', protect, listBorrows);
router.post('/', protect, requireAdmin, assignBook);
router.put('/:id/return', protect, requireAdmin, markReturned);
router.get('/overdue', protect, requireAdmin, listOverdue);

export default router;
