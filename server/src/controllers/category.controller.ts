import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import Category from '../models/Category.js';

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).toLowerCase(),
  iconEmoji: z.string().optional(),
});

export async function listCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = categorySchema.parse(req.body);
    const category = await Category.create(data);
    res.status(201).json({ category });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await Category.findByIdAndUpdate(req.params.id, data, { new: true });
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ category });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    next(err);
  }
}
