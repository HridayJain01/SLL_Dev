import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Borrow from '../models/Borrow.js';
import Notification from '../models/Notification.js';
import { emailService } from '../lib/email/index.js';
import { makeUser, makeBook, cookieFor } from './helpers.js';

const reminder = vi.spyOn(emailService, 'dueReminder');

beforeEach(() => {
  reminder.mockClear();
  reminder.mockResolvedValue(true);
  process.env.CRON_SECRET = 'test-cron-secret';
});

/** A delivered loan falling due inside the reminder window. */
async function makeDueLoan(daysUntilDue = 1) {
  const user = await makeUser();
  const book = await makeBook();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysUntilDue);

  const borrow = await Borrow.create({
    userId: user._id,
    bookId: book._id,
    dueDate,
    deliveredAt: new Date(),
    cycleMonth: new Date().getMonth() + 1,
    cycleYear: new Date().getFullYear(),
    status: 'ACTIVE',
    fulfilment: 'WITH_MEMBER',
  });
  return { user, book, borrow };
}

const callCron = (token = 'test-cron-secret') =>
  request(app)
    .get('/api/notifications/cron/reminders')
    .set('Authorization', `Bearer ${token}`);

describe('GET /api/notifications/cron/reminders', () => {
  it('reminds a member whose book is nearly due', async () => {
    const { user } = await makeDueLoan();

    const res = await callCron();

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true, notifications: 1, emails: 1 });
    expect(reminder).toHaveBeenCalledOnce();
    expect(await Notification.countDocuments({ userId: user._id, type: 'DUE_REMINDER' })).toBe(1);
  });

  it('does not remind the same loan twice in one day', async () => {
    await makeDueLoan();

    const first = await callCron();
    const second = await callCron();

    expect(first.body.notifications).toBe(1);
    // The whole point of remindedAt: a retried or double-fired schedule is a no-op.
    expect(second.body.notifications).toBe(0);
    expect(second.body.emails).toBe(0);
    expect(reminder).toHaveBeenCalledOnce();
    expect(await Notification.countDocuments({ type: 'DUE_REMINDER' })).toBe(1);
  });

  it('reminds again the next day', async () => {
    const { borrow } = await makeDueLoan();
    await callCron();

    // Yesterday's stamp must not suppress today's reminder.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await Borrow.updateOne({ _id: borrow._id }, { remindedAt: yesterday });

    const res = await callCron();
    expect(res.body.notifications).toBe(1);
  });

  it('ignores loans that are not due yet', async () => {
    await makeDueLoan(30);
    const res = await callCron();
    expect(res.body.notifications).toBe(0);
  });

  it('ignores undelivered orders, which have no due date', async () => {
    const user = await makeUser();
    const book = await makeBook();
    await Borrow.create({
      userId: user._id,
      bookId: book._id,
      cycleMonth: new Date().getMonth() + 1,
      cycleYear: new Date().getFullYear(),
      status: 'ACTIVE',
      fulfilment: 'PREPARING',
    });

    const res = await callCron();
    expect(res.body.notifications).toBe(0);
  });

  it('ignores books already back on the shelf', async () => {
    const { borrow } = await makeDueLoan();
    await Borrow.updateOne({ _id: borrow._id }, { status: 'RETURNED', fulfilment: 'COLLECTED' });

    const res = await callCron();
    expect(res.body.notifications).toBe(0);
  });

  it('groups one email per member across several due books', async () => {
    const user = await makeUser();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 1);

    for (let i = 0; i < 3; i++) {
      const book = await makeBook();
      await Borrow.create({
        userId: user._id,
        bookId: book._id,
        dueDate,
        deliveredAt: new Date(),
        cycleMonth: new Date().getMonth() + 1,
        cycleYear: new Date().getFullYear(),
        status: 'ACTIVE',
        fulfilment: 'WITH_MEMBER',
      });
    }

    const res = await callCron();

    // One in-app notification per book, but a single grouped email.
    expect(res.body.notifications).toBe(3);
    expect(res.body.emails).toBe(1);
    expect(reminder).toHaveBeenCalledOnce();
    expect(reminder.mock.calls[0][2]).toHaveLength(3);
  });
});

describe('cron endpoint authorisation', () => {
  it('rejects a wrong token', async () => {
    await makeDueLoan();
    const res = await callCron('wrong-secret');
    expect(res.status).toBe(401);
    expect(reminder).not.toHaveBeenCalled();
  });

  it('rejects a request with no Authorization header', async () => {
    const res = await request(app).get('/api/notifications/cron/reminders');
    expect(res.status).toBe(401);
  });

  it('stays shut when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;
    // A missing variable must fail closed, never open the route to anyone.
    const res = await request(app).get('/api/notifications/cron/reminders');
    expect(res.status).toBe(503);
  });

  it('is not reachable with an ordinary member session', async () => {
    const user = await makeUser();
    const res = await request(app)
      .get('/api/notifications/cron/reminders')
      .set('Cookie', cookieFor(user));
    expect(res.status).toBe(401);
  });
});
