"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = protect;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = __importDefault(require("../models/User.js"));
async function protect(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ message: 'Not authenticated' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.user = await User_js_1.default.findById(decoded.id).select('-password');
        if (!req.user)
            return res.status(401).json({ message: 'User not found' });
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid token' });
    }
}
//# sourceMappingURL=auth.js.map