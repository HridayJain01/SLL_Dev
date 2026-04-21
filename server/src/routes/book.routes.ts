import { Router } from 'express';
import { listBooks, getBookById, createBook, updateBook, deleteBook } from '../controllers/book.controller.js';
import { protect } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { upload } from '../middleware/upload.js';

const router = Router();

router.get('/', listBooks);
router.get('/:id', getBookById);
router.post('/', protect, requireAdmin, upload.single('coverImage'), createBook);
router.put('/:id', protect, requireAdmin, upload.single('coverImage'), updateBook);
router.delete('/:id', protect, requireAdmin, deleteBook);

export default router;
