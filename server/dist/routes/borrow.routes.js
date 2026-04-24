"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const borrow_controller_js_1 = require("../controllers/borrow.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const requireAdmin_js_1 = require("../middleware/requireAdmin.js");
const router = (0, express_1.Router)();
router.get('/', auth_js_1.protect, borrow_controller_js_1.listBorrows);
router.post('/request', auth_js_1.protect, borrow_controller_js_1.requestBooks);
router.post('/', auth_js_1.protect, requireAdmin_js_1.requireAdmin, borrow_controller_js_1.assignBook);
router.put('/:id/return', auth_js_1.protect, requireAdmin_js_1.requireAdmin, borrow_controller_js_1.markReturned);
router.get('/overdue', auth_js_1.protect, requireAdmin_js_1.requireAdmin, borrow_controller_js_1.listOverdue);
exports.default = router;
//# sourceMappingURL=borrow.routes.js.map