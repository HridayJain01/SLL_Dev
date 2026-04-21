"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_js_1 = require("../controllers/auth.controller.js");
const auth_js_1 = require("../middleware/auth.js");
const router = (0, express_1.Router)();
router.post('/signup', auth_controller_js_1.signup);
router.post('/login', auth_controller_js_1.login);
router.post('/logout', auth_controller_js_1.logout);
router.get('/me', auth_js_1.protect, auth_controller_js_1.getMe);
router.post('/change-password', auth_js_1.protect, auth_controller_js_1.changePassword);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map