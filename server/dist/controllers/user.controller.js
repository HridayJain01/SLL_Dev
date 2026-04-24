"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getAdminOverviewStats = getAdminOverviewStats;
exports.getUserById = getUserById;
exports.updateUserStatus = updateUserStatus;
exports.updateUserRole = updateUserRole;
const zod_1 = require("zod");
const User_js_1 = __importDefault(require("../models/User.js"));
const Membership_js_1 = __importDefault(require("../models/Membership.js"));
const Borrow_js_1 = __importDefault(require("../models/Borrow.js"));
const Book_js_1 = __importDefault(require("../models/Book.js"));
async function listUsers(req, res, next) {
    try {
        const { status, role, search } = req.query;
        const filter = {};
        if (status)
            filter.status = status;
        if (role)
            filter.role = role;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const users = await User_js_1.default.find(filter).select('-password').sort({ createdAt: -1 });
        res.json({ users });
    }
    catch (err) {
        next(err);
    }
}
async function getAdminOverviewStats(_req, res, next) {
    try {
        const now = new Date();
        const [totalUsers, activeMembers, totalBooks, booksOut, overdueBooks, pendingUsers, recentBorrows] = await Promise.all([
            User_js_1.default.countDocuments(),
            Membership_js_1.default.countDocuments({ status: 'ACTIVE', endDate: { $gte: now } }),
            Book_js_1.default.countDocuments(),
            Borrow_js_1.default.countDocuments({ status: 'ACTIVE' }),
            Borrow_js_1.default.countDocuments({ $or: [{ status: 'OVERDUE' }, { status: 'ACTIVE', dueDate: { $lt: now } }] }),
            User_js_1.default.countDocuments({ status: 'PENDING' }),
            Borrow_js_1.default.find()
                .populate('userId', 'name email')
                .populate('bookId', 'title coverImage')
                .sort({ createdAt: -1 })
                .limit(5),
        ]);
        res.json({
            stats: {
                totalUsers,
                activeMembers,
                totalBooks,
                booksOut,
                overdueBooks,
                pendingUsers,
            },
            recentBorrows,
        });
    }
    catch (err) {
        next(err);
    }
}
async function getUserById(req, res, next) {
    try {
        const user = await User_js_1.default.findById(req.params.id).select('-password');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const membership = await Membership_js_1.default.findOne({ userId: user._id });
        const borrows = await Borrow_js_1.default.find({ userId: user._id })
            .populate('bookId', 'title coverImage')
            .sort({ createdAt: -1 });
        res.json({ user, membership, borrows });
    }
    catch (err) {
        next(err);
    }
}
async function updateUserStatus(req, res, next) {
    try {
        const { status } = zod_1.z.object({ status: zod_1.z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']) }).parse(req.body);
        const user = await User_js_1.default.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function updateUserRole(req, res, next) {
    try {
        const { role } = zod_1.z.object({ role: zod_1.z.enum(['USER', 'ADMIN']) }).parse(req.body);
        const user = await User_js_1.default.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        res.json({ user });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
//# sourceMappingURL=user.controller.js.map