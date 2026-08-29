import { Router } from 'express';
import {
  signup,
  login,
  logout,
  getMe,
  changePassword,
  googleAuth,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth);
router.post('/logout', logout);
// Both sit under the auth rate limiter mounted in app.ts — these are exactly the
// endpoints worth guessing against.
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.post('/change-password', protect, changePassword);

export default router;
