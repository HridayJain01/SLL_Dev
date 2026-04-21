"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
exports.createCategory = createCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
const zod_1 = require("zod");
const Category_js_1 = __importDefault(require("../models/Category.js"));
const categorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1).toLowerCase(),
    iconEmoji: zod_1.z.string().optional(),
});
async function listCategories(_req, res, next) {
    try {
        const categories = await Category_js_1.default.find().sort({ name: 1 });
        res.json({ categories });
    }
    catch (err) {
        next(err);
    }
}
async function createCategory(req, res, next) {
    try {
        const data = categorySchema.parse(req.body);
        const category = await Category_js_1.default.create(data);
        res.status(201).json({ category });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function updateCategory(req, res, next) {
    try {
        const data = categorySchema.partial().parse(req.body);
        const category = await Category_js_1.default.findByIdAndUpdate(req.params.id, data, { new: true });
        if (!category)
            return res.status(404).json({ message: 'Category not found' });
        res.json({ category });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ message: 'Validation error', errors: err.errors });
        }
        next(err);
    }
}
async function deleteCategory(req, res, next) {
    try {
        const category = await Category_js_1.default.findByIdAndDelete(req.params.id);
        if (!category)
            return res.status(404).json({ message: 'Category not found' });
        res.json({ message: 'Category deleted successfully' });
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=category.controller.js.map