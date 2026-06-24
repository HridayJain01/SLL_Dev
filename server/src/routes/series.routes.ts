import { Router } from 'express';
import { listSeries, getSeriesBySlug, createSeries, updateSeries, deleteSeries } from '../controllers/series.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', listSeries);
router.get('/:slug', getSeriesBySlug);
router.post('/', protect, requireAdmin, upload.single('image'), createSeries);
router.put('/:id', protect, requireAdmin, upload.single('image'), updateSeries);
router.delete('/:id', protect, requireAdmin, deleteSeries);

export default router;
