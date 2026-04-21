"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_js_1 = require("../controllers/category.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const requireAdmin_js_1 = require("../middleware/requireAdmin.js");
const router = (0, express_1.Router)();
router.get('/', category_controller_js_1.listCategories);
router.post('/', auth_js_1.protect, requireAdmin_js_1.requireAdmin, category_controller_js_1.createCategory);
router.put('/:id', auth_js_1.protect, requireAdmin_js_1.requireAdmin, category_controller_js_1.updateCategory);
router.delete('/:id', auth_js_1.protect, requireAdmin_js_1.requireAdmin, category_controller_js_1.deleteCategory);
exports.default = router;
//# sourceMappingURL=category.routes.js.map