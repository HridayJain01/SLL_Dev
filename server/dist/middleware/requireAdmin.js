"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
function requireAdmin(req, res, next) {
    if (req.user?.role !== 'ADMIN')
        return res.status(403).json({ message: 'Admin access required' });
    next();
}
//# sourceMappingURL=requireAdmin.js.map