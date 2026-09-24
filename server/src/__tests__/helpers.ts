import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Book from '../models/Book.js';
import Category from '../models/Category.js';
import Membership from '../models/Membership.js';

export async function makeUser(overrides: Record<string, unknown> = {}) {
  return User.create({
    name: 'Test Member',
    email: `member-${Math.random().toString(36).slice(2)}@example.com`,
    password: 'password123',
    status: 'ACTIVE',
    // Orders are refused without these, so every test member is deliverable.
    phone: '90000 00000',
    addresses: [{ label: 'Home', line: '1 Test Street, Pune', isDefault: true }],
    ...overrides,
  });
}

/** The session cookie `protect` reads, minted the same way the login route does. */
export function cookieFor(user: { _id: unknown }) {
  const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  return [`token=${token}`];
}

export async function makeCategory() {
  const suffix = Math.random().toString(36).slice(2);
  return Category.create({ name: `Picture Books ${suffix}`, slug: `pb-${suffix}` });
}

export async function makeBook(overrides: Record<string, unknown> = {}) {
  const category = await makeCategory();
  return Book.create({
    title: 'The Very Hungry Test Case',
    description: 'A book that exists only to be borrowed.',
    ageGroupMin: 2,
    ageGroupMax: 5,
    categoryId: category._id,
    planAccess: ['LITTLE_READER'],
    totalCopies: 1,
    kind: 'book',
    ...overrides,
  });
}

export async function makeMembership(userId: unknown, overrides: Record<string, unknown> = {}) {
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);
  return Membership.create({
    userId,
    plan: 'STAR_READER',
    durationMonths: 1,
    startDate: start,
    endDate: end,
    booksPerCycle: 8,
    monthlyTotalLimit: 8,
    status: 'ACTIVE',
    // Orders are refused without these, so every test member is deliverable.
    phone: '90000 00000',
    addresses: [{ label: 'Home', line: '1 Test Street, Pune', isDefault: true }],
    ...overrides,
  });
}
