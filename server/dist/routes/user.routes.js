"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_js_1 = require("../controllers/user.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const requireAdmin_js_1 = require("../middleware/requireAdmin.js");
const router = (0, express_1.Router)();
router.use(auth_js_1.protect, requireAdmin_js_1.requireAdmin);
router.get('/', user_controller_js_1.listUsers);
router.get('/:id', user_controller_js_1.getUserById);
router.put('/:id/status', user_controller_js_1.updateUserStatus);
router.put('/:id/role', user_controller_js_1.updateUserRole);
exports.default = router;
//# sourceMappingURL=user.routes.js.map