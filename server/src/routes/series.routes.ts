import { Router } from 'express';
import {
  listSeries,
  getSeriesBySlug,
  createSeries,
  updateSeries,
  deleteSeries,
  listSeriesParts,
  addSeriesPart,
  removeSeriesPart,
  reorderSeriesParts,
} from '../controllers/series.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', listSeries);

// Parts management (admin) — declared before the '/:slug' and '/:id' matchers
// so these literal paths aren't swallowed as a slug/id.
router.get('/manage/parts', protect, requireAdmin, listSeriesParts);
router.post('/manage/parts', protect, requireAdmin, addSeriesPart);
router.put('/manage/parts/order', protect, requireAdmin, reorderSeriesParts);
router.delete('/manage/parts/:bookId', protect, requireAdmin, removeSeriesPart);

router.get('/:slug', getSeriesBySlug);
router.post('/', protect, requireAdmin, upload.single('image'), createSeries);
router.put('/:id', protect, requireAdmin, upload.single('image'), updateSeries);
router.delete('/:id', protect, requireAdmin, deleteSeries);

export default router;
