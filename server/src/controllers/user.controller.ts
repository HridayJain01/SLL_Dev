import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import Borrow from '../models/Borrow.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';
import { AuthRequest } from '../middleware/auth.js';

/* ------------------------------------------------------------------ *
 * Self-service ("My Account") — a signed-in member managing their own
 * profile, children and delivery addresses.
 * ------------------------------------------------------------------ */

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').trim().optional(),
  phone: z.string().trim().max(20).optional(),
});

const childSchema = z
  .object({
    name: z.string().min(1, 'Name is required').trim(),
    ageMin: z.coerce.number().int().min(0).max(18),
    ageMax: z.coerce.number().int().min(0).max(18),
  })
  .refine((child) => child.ageMax >= child.ageMin, {
    message: 'Maximum age must be the same as or above the minimum age',
    path: ['ageMax'],
  });

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required').trim(),
  line: z.string().min(1, 'Address is required').trim(),
  isDefault: z.boolean().optional(),
});

/** Loads the caller's own document. `protect` already proved the id is valid. */
async function loadSelf(req: AuthRequest) {
  return User.findById(req.user._id).select('-password');
}

/** Keeps exactly one address flagged as the default. */
function applyDefaultAddress(user: any, defaultId?: string) {
  if (user.addresses.length === 0) return;
  const target =
    (defaultId && user.addresses.id(defaultId)) ||
    user.addresses.find((address: any) => address.isDefault) ||
    user.addresses[0];
  user.addresses.forEach((address: any) => {
    address.isDefault = String(address._id) === String(target._id);
  });
}

export async function getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = profileSchema.parse(req.body);
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    await user.save();

    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function addChild(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = childSchema.parse(req.body);
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.children.push(data);
    await user.save();
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateChild(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = childSchema.parse(req.body);
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const child = user.children.id(req.params.childId);
    if (!child) return res.status(404).json({ message: 'Child profile not found' });

    child.set(data);
    await user.save();
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function deleteChild(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const child = user.children.id(req.params.childId);
    if (!child) return res.status(404).json({ message: 'Child profile not found' });

    child.deleteOne();
    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function addAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = addressSchema.parse(req.body);
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // The first address saved is always the default.
    const makeDefault = data.isDefault || user.addresses.length === 0;
    user.addresses.push({ label: data.label, line: data.line, isDefault: false });
    const added = user.addresses[user.addresses.length - 1];
    applyDefaultAddress(user, makeDefault ? String(added._id) : undefined);

    await user.save();
    res.status(201).json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const data = addressSchema.parse(req.body);
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    address.set({ label: data.label, line: data.line });
    applyDefaultAddress(user, data.isDefault ? String(address._id) : undefined);

    await user.save();
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ message: 'Address not found' });

    address.deleteOne();
    // Promote another address when the default was the one removed.
    applyDefaultAddress(user);

    await user.save();
    res.json({ user });
  } catch (err) {
    next(err);
  }
}

/**
 * Pauses the member's own account: the membership is suspended so no new
 * orders can be placed, but the login stays usable so they can reactivate.
 */
export async function deactivateMyAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.deactivatedAt = new Date();
    await user.save();

    // Updated in place rather than loaded-and-saved: memberships created before
    // the plans were renamed still carry legacy plan codes, which a full
    // document validation would reject.
    const membership = await Membership.findOneAndUpdate(
      { userId: user._id, status: 'ACTIVE' },
      { status: 'SUSPENDED' },
      { new: true }
    );

    await Notification.create({
      userId: user._id,
      type: 'GENERAL',
      message: 'Your account is paused. Deliveries are on hold — reactivate any time from My Account.',
    });

    const admins = await User.find({ role: 'ADMIN' }).select('_id');
    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          userId: admin._id,
          type: 'GENERAL' as const,
          message: `${user.name} paused their account and deliveries.`,
        }))
      );
    }

    res.json({ user, membership });
  } catch (err) {
    next(err);
  }
}

/** Undoes a self-service pause — admin suspensions are left untouched. */
export async function reactivateMyAccount(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await loadSelf(req);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.deactivatedAt) {
      return res.status(400).json({ message: 'Your account is already active' });
    }

    user.deactivatedAt = null;
    await user.save();

    const membership = await Membership.findOneAndUpdate(
      { userId: user._id, status: 'SUSPENDED', endDate: { $gte: new Date() } },
      { status: 'ACTIVE' },
      { new: true }
    );

    await Notification.create({
      userId: user._id,
      type: 'GENERAL',
      message: 'Welcome back! Your account is active again.',
    });

    res.json({ user, membership });
  } catch (err) {
    next(err);
  }
}

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, role, search } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
}

export async function getAdminOverviewStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();
    const [
      totalUsers,
      activeMembers,
      totalBooks,
      booksOut,
      overdueBooks,
      pendingUsers,
      awaitingDispatch,
      outForDelivery,
      pickupsPending,
      recentBorrows,
    ] = await Promise.all([
      User.countDocuments(),
      Membership.countDocuments({ status: 'ACTIVE', endDate: { $gte: now } }),
      Book.countDocuments(),
      // Everything not physically back on the shelf, at any stage of the journey.
      Borrow.countDocuments({ status: { $ne: 'RETURNED' } }),
      // Overdue is derived from the due date, which only exists after delivery.
      Borrow.countDocuments({ status: 'ACTIVE', dueDate: { $ne: null, $lt: now } }),
      User.countDocuments({ status: 'PENDING' }),
      Borrow.countDocuments({ status: 'ACTIVE', fulfilment: 'PREPARING' }),
      Borrow.countDocuments({ status: 'ACTIVE', fulfilment: 'OUT_FOR_DELIVERY' }),
      Borrow.countDocuments({ status: 'ACTIVE', fulfilment: { $in: ['RETURN_REQUESTED', 'PICKUP_SCHEDULED'] } }),
      Borrow.find()
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
        awaitingDispatch,
        outForDelivery,
        pickupsPending,
      },
      recentBorrows,
    });
  } catch (err) {
    next(err);
  }
}

export async function getUserById(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const membership = await Membership.findOne({ userId: user._id });
    const borrows = await Borrow.find({ userId: user._id })
      .populate('bookId', 'title coverImage')
      .sort({ createdAt: -1 });

    res.json({ user, membership, borrows });
  } catch (err) {
    next(err);
  }
}

export async function updateUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = z.object({ status: z.enum(['PENDING', 'ACTIVE', 'SUSPENDED']) }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}

export async function updateUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = z.object({ role: z.enum(['USER', 'ADMIN']) }).parse(req.body);
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    }
    next(err);
  }
}
