"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.logout = logout;
exports.getMe = getMe;
exports.changePassword = changePassword;
const zod_1 = require("zod");
const User_js_1 = __importDefault(require("../models/User.js"));
const jwt_js_1 = require("../lib/jwt.js");
const signupSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required').trim(),
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
const changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1),
    newPassword: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
async function signup(req, res, next) {
    try {
        const data = signupSchema.parse(req.body);
        const existing = await User_js_1.default.findOne({ email: data.email });
        if (existing)
            return res.status(400).json({ message: 'Email already registered' });
        const user = await User_js_1.default.create(data);
        const token = (0, jwt_js_1.signToken)(String(user._id));
        (0, jwt_js_1.setCookieToken)(res, token);
        const userObj = user.toObject();
        const { password, ...userWithoutPassword } = userObj;
        res.status(201).json({ user: userWithoutPassword });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function login(req, res, next) {
    try {
        const data = loginSchema.parse(req.body);
        const user = await User_js_1.default.findOne({ email: data.email });
        if (!user)
            return res.status(401).json({ message: 'Invalid email or password' });
        const isMatch = await user.comparePassword(data.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password' });
        if (user.status === 'PENDING') {
            return res.status(403).json({ message: 'Account pending admin approval' });
        }
        if (user.status === 'SUSPENDED') {
            return res.status(403).json({ message: 'Account suspended' });
        }
        const token = (0, jwt_js_1.signToken)(String(user._id));
        (0, jwt_js_1.setCookieToken)(res, token);
        const userObj = user.toObject();
        const { password, ...userWithoutPassword } = userObj;
        res.json({ user: userWithoutPassword });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function logout(_req, res) {
    res.cookie('token', '', { httpOnly: true, expires: new Date(0) });
    res.json({ message: 'Logged out successfully' });
}
async function getMe(req, res) {
    res.json({ user: req.user });
}
async function changePassword(req, res, next) {
    try {
        const data = changePasswordSchema.parse(req.body);
        const user = await User_js_1.default.findById(req.user._id);
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const isMatch = await user.comparePassword(data.currentPassword);
        if (!isMatch)
            return res.status(400).json({ message: 'Current password is incorrect' });
        user.password = data.newPassword;
        await user.save();
        res.json({ message: 'Password changed successfully' });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
//# sourceMappingURL=auth.controller.js.map