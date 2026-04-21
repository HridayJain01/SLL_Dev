"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const membership_controller_js_1 = require("../controllers/membership.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const requireAdmin_js_1 = require("../middleware/requireAdmin.js");
const router = (0, express_1.Router)();
router.get('/me', auth_js_1.protect, membership_controller_js_1.getMyMembership);
router.post('/', auth_js_1.protect, requireAdmin_js_1.requireAdmin, membership_controller_js_1.createMembership);
router.put('/:id', auth_js_1.protect, requireAdmin_js_1.requireAdmin, membership_controller_js_1.updateMembership);
exports.default = router;
//# sourceMappingURL=membership.routes.js.map