import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Borrow from '../models/Borrow.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { emailService } from '../lib/email/index.js';
import { cookieFor, makeBook, makeUser } from './helpers.js';

const mail = vi.spyOn(emailService, 'backInStock').mockResolvedValue(true);

async function lendOut(book: { _id: unknown }) {
  const holder = await makeUser();
  return Borrow.create({
    userId: holder._id, bookId: book._id, issueDate: new Date(), cycleMonth: 1, cycleYear: 2026,
    status: 'ACTIVE', fulfilment: 'PICKUP_SCHEDULED',
  });
}

describe('notify me when available', () => {
  it('only takes requests for titles that are out, and fires once when a copy comes back', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const waiter = await makeUser();
    const book = await makeBook({ totalCopies: 1 });

    const early = await request(app).post(`/api/books/${book._id}/notify`).set('Cookie', cookieFor(waiter));
    expect(early.status).toBe(409);

    const loan = await lendOut(book);
    const sub = await request(app).post(`/api/books/${book._id}/notify`).set('Cookie', cookieFor(waiter));
    expect(sub.body.subscribed).toBe(true);
    const status = await request(app).get(`/api/books/${book._id}/notify`).set('Cookie', cookieFor(waiter));
    expect(status.body.subscribed).toBe(true);

    const back = await request(app)
      .post('/api/borrows/mark-collected')
      .set('Cookie', cookieFor(admin))
      .send({ borrowIds: [String(loan._id)] });
    expect(back.status).toBe(200);

    expect(await Notification.countDocuments({ userId: waiter._id, type: 'BACK_IN_STOCK' })).toBe(1);
    expect(mail).toHaveBeenCalledWith(waiter.email, waiter.name, book.title, String(book._id));
    const after = await User.findById(waiter._id).select('+stockAlerts').lean();
    expect(after!.stockAlerts).toHaveLength(0);
  });

  it('fires when an admin adds copies', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const waiter = await makeUser();
    const book = await makeBook({ totalCopies: 1 });
    await lendOut(book);
    await request(app).post(`/api/books/${book._id}/notify`).set('Cookie', cookieFor(waiter));

    const res = await request(app).put(`/api/books/${book._id}`).set('Cookie', cookieFor(admin)).send({ totalCopies: 2 });
    expect(res.status).toBe(200);
    expect(await Notification.countDocuments({ userId: waiter._id, type: 'BACK_IN_STOCK' })).toBe(1);
  });
});
