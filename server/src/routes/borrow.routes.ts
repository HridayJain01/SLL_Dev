import { Router } from 'express';
import { listBorrows, requestBooks, requestReturn, assignBook, markReturned, listOverdue, assignDelivery } from '../controllers/borrow.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', protect, listBorrows);
router.post('/request', protect, requestBooks);
router.post('/return-request', protect, requestReturn);
router.post('/', protect, requireAdmin, assignBook);
router.put('/:id/return', protect, requireAdmin, markReturned);
router.post('/assign-delivery', protect, requireAdmin, assignDelivery);
router.get('/overdue', protect, requireAdmin, listOverdue);

export default router;
