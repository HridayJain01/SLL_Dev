"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const book_controller_js_1 = require("../controllers/book.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const requireAdmin_js_1 = require("../middleware/requireAdmin.js");
const upload_js_1 = require("../middleware/upload.js");
const router = (0, express_1.Router)();
router.get('/', book_controller_js_1.listBooks);
router.get('/:id', book_controller_js_1.getBookById);
router.post('/', auth_js_1.protect, requireAdmin_js_1.requireAdmin, upload_js_1.upload.single('coverImage'), book_controller_js_1.createBook);
router.put('/:id', auth_js_1.protect, requireAdmin_js_1.requireAdmin, upload_js_1.upload.single('coverImage'), book_controller_js_1.updateBook);
router.delete('/:id', auth_js_1.protect, requireAdmin_js_1.requireAdmin, book_controller_js_1.deleteBook);
exports.default = router;
//# sourceMappingURL=book.routes.js.map