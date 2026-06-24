import { Router } from 'express';
import { listBooks, getBookById, getRecommendedBooks, createBook, updateBook, deleteBook } from '../controllers/book.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', listBooks);
// Must precede '/:id' so "recommended" isn't treated as a book id.
router.get('/recommended', protect, getRecommendedBooks);
router.get('/:id', getBookById);
router.post('/', protect, requireAdmin, upload.array('images', 12), createBook);
router.put('/:id', protect, requireAdmin, upload.array('images', 12), updateBook);
router.delete('/:id', protect, requireAdmin, deleteBook);

export default router;
