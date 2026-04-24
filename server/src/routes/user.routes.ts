import { Router } from 'express';
import { listUsers, getAdminOverviewStats, getUserById, updateUserStatus, updateUserRole } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

router.use(protect, requireAdmin);

router.get('/', listUsers);
router.get('/stats/overview', getAdminOverviewStats);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.put('/:id/role', updateUserRole);

export default router;
