import { Router } from 'express';
import {
  listBorrows,
  requestBooks,
  requestReturn,
  assignBook,
  markDelivered,
  markCollected,
  listOverdue,
  assignDelivery,
  assignPickup,
} from '../controllers/borrow.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', protect, listBorrows);
router.post('/request', protect, requestBooks);
router.post('/return-request', protect, requestReturn);
router.post('/', protect, requireAdmin, assignBook);

// Circulation lifecycle. Each step is a bulk action because an order is a batch
// of borrows and the member gets one combined message per step.
router.post('/assign-delivery', protect, requireAdmin, assignDelivery);
router.post('/mark-delivered', protect, requireAdmin, markDelivered);
router.post('/assign-pickup', protect, requireAdmin, assignPickup);
router.post('/mark-collected', protect, requireAdmin, markCollected);

// Single-borrow return, kept so one row can be closed without building a batch.
router.put('/:id/return', protect, requireAdmin, markCollected);

router.get('/overdue', protect, requireAdmin, listOverdue);

export default router;
