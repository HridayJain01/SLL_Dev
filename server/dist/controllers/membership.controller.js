"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyMembership = getMyMembership;
exports.createMembership = createMembership;
exports.updateMembership = updateMembership;
const zod_1 = require("zod");
const Membership_js_1 = __importDefault(require("../models/Membership.js"));
const User_js_1 = __importDefault(require("../models/User.js"));
const constants_js_1 = require("../config/constants.js");
const createMembershipSchema = zod_1.z.object({
    userId: zod_1.z.string().min(1),
    plan: zod_1.z.enum(['NORMAL', 'PREMIUM']),
    durationMonths: zod_1.z.coerce.number().refine((v) => [1, 3, 6, 12].includes(v)),
    startDate: zod_1.z.coerce.date(),
});
const updateMembershipSchema = zod_1.z.object({
    status: zod_1.z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']).optional(),
    plan: zod_1.z.enum(['NORMAL', 'PREMIUM']).optional(),
    durationMonths: zod_1.z.coerce.number().refine((v) => [1, 3, 6, 12].includes(v)).optional(),
    startDate: zod_1.z.coerce.date().optional(),
    endDate: zod_1.z.coerce.date().optional(),
});
async function getMyMembership(req, res, next) {
    try {
        const membership = await Membership_js_1.default.findOne({ userId: req.user._id });
        res.json({ membership });
    }
    catch (err) {
        next(err);
    }
}
async function createMembership(req, res, next) {
    try {
        const data = createMembershipSchema.parse(req.body);
        const startDate = new Date(data.startDate);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + data.durationMonths);
        const booksPerCycle = constants_js_1.PLAN_QUOTA[data.plan];
        // Delete existing membership if any
        await Membership_js_1.default.findOneAndDelete({ userId: data.userId });
        const membership = await Membership_js_1.default.create({
            userId: data.userId,
            plan: data.plan,
            durationMonths: data.durationMonths,
            startDate,
            endDate,
            booksPerCycle,
            status: 'ACTIVE',
        });
        // Activate the user
        await User_js_1.default.findByIdAndUpdate(data.userId, { status: 'ACTIVE' });
        res.status(201).json({ membership });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function updateMembership(req, res, next) {
    try {
        const data = updateMembershipSchema.parse(req.body);
        const membership = await Membership_js_1.default.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!membership)
            return res.status(404).json({ message: 'Membership not found' });
        res.json({ membership });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
//# sourceMappingURL=membership.controller.js.map