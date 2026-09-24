import { Router } from 'express';
import { listPlans, updatePlan } from '../controllers/plan.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.get('/', listPlans);
router.put('/:code', protect, requireAdmin, updatePlan);

export default router;
