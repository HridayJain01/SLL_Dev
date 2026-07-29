import { Router } from 'express';
import {
  getMyProfile,
  updateMyProfile,
  addChild,
  updateChild,
  deleteChild,
  addAddress,
  updateAddress,
  deleteAddress,
  deactivateMyAccount,
  reactivateMyAccount,
  listUsers,
  getAdminOverviewStats,
  getUserById,
  updateUserStatus,
  updateUserRole,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';

const router = Router();

// Self-service account routes — declared before the admin guard below so a
// member can reach their own profile, and before '/:id' so "me" isn't read as
// a user id.
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);
router.post('/me/children', protect, addChild);
router.put('/me/children/:childId', protect, updateChild);
router.delete('/me/children/:childId', protect, deleteChild);
router.post('/me/addresses', protect, addAddress);
router.put('/me/addresses/:addressId', protect, updateAddress);
router.delete('/me/addresses/:addressId', protect, deleteAddress);
router.post('/me/deactivate', protect, deactivateMyAccount);
router.post('/me/reactivate', protect, reactivateMyAccount);

// Everything below is admin-only.
router.use(protect, requireAdmin);

router.get('/', listUsers);
router.get('/stats/overview', getAdminOverviewStats);
router.get('/:id', getUserById);
router.put('/:id/status', updateUserStatus);
router.put('/:id/role', updateUserRole);

export default router;
