import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Borrow from '../models/Borrow.js';
import { makeUser, makeBook, makeMembership, cookieFor } from './helpers.js';

/** A bag from an earlier cycle, delivered and with the member. */
async function makeHeldBag(userId: unknown, size: number) {
  const issueDate = new Date(Date.now() - 40 * 86_400_000);
  const rows = [];
  for (let i = 0; i < size; i++) {
    const book = await makeBook();
    rows.push(await Borrow.create({
      userId, bookId: book._id, issueDate, cycleMonth: 1, cycleYear: 2026,
      status: 'ACTIVE', fulfilment: 'WITH_MEMBER', deliveredAt: issueDate, dueDate: new Date(),
    }));
  }
  return rows;
}

const ids = (rows: { _id: unknown }[]) => rows.map((r) => String(r._id));

describe('every delivery is a swap', () => {
  it('links the bag the member holds to their new order, and collects it on delivery', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const member = await makeUser();
    await makeMembership(member._id);
    const old = await makeHeldBag(member._id, 2);
    const book = await makeBook({ totalCopies: 2 });

    const placed = await request(app).post('/api/borrows/request').set('Cookie', cookieFor(member))
      .send({ bookIds: [String(book._id)] });
    expect(placed.status).toBe(201);
    expect(placed.body.collecting).toBe(2);

    const issueDate = new Date(placed.body.borrows[0].issueDate);
    const linked = await Borrow.find({ _id: { $in: ids(old) } });
    expect(linked.every((b) => b.fulfilment === 'RETURN_REQUESTED')).toBe(true);
    expect(linked.every((b) => b.swapWith?.getTime() === issueDate.getTime())).toBe(true);

    const newIds = ids(placed.body.borrows);
    const assigned = await request(app).post('/api/borrows/assign-delivery').set('Cookie', cookieFor(admin))
      .send({ borrowIds: newIds, personName: 'Ravi' });
    expect(assigned.status).toBe(200);
    const scheduled = await Borrow.find({ _id: { $in: ids(old) } });
    expect(scheduled.every((b) => b.fulfilment === 'PICKUP_SCHEDULED' && b.pickup.partnerName === 'Ravi')).toBe(true);

    const delivered = await request(app).post('/api/borrows/mark-delivered').set('Cookie', cookieFor(admin))
      .send({ borrowIds: newIds, collectSwap: true });
    expect(delivered.status).toBe(200);
    expect(delivered.body.collected).toBe(2);
    expect(await Borrow.countDocuments({ _id: { $in: ids(old) }, status: 'RETURNED' })).toBe(2);
    expect(await Borrow.countDocuments({ _id: { $in: newIds }, fulfilment: 'WITH_MEMBER' })).toBe(1);
  });
});

describe('standalone pickup', () => {
  it('is refused while the member can still order next month', async () => {
    const member = await makeUser();
    await makeMembership(member._id, { endDate: new Date(Date.now() + 60 * 86_400_000) });
    const bag = await makeHeldBag(member._id, 1);

    const res = await request(app).post('/api/borrows/return-request').set('Cookie', cookieFor(member))
      .send({ orderId: String(bag[0]._id) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ride along with your next delivery/);
    expect((await Borrow.findById(bag[0]._id))!.fulfilment).toBe('WITH_MEMBER');
  });

  it('is allowed in the final month, when there is no next order to swap with', async () => {
    const member = await makeUser();
    const now = new Date();
    const endsThisMonth = new Date(new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() - 1);
    await makeMembership(member._id, { endDate: endsThisMonth });
    const bag = await makeHeldBag(member._id, 1);

    const res = await request(app).post('/api/borrows/return-request').set('Cookie', cookieFor(member))
      .send({ orderId: String(bag[0]._id) });
    expect(res.status).toBe(200);
  });
});

describe('admin stage override', () => {
  it('moves a bag backwards and forwards, keeping dates consistent', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const member = await makeUser();
    const bag = await makeHeldBag(member._id, 2);
    const set = (fulfilment: string) =>
      request(app).post('/api/borrows/set-stage').set('Cookie', cookieFor(admin))
        .send({ borrowIds: ids(bag), fulfilment });

    expect((await set('COLLECTED')).status).toBe(200);
    expect(await Borrow.countDocuments({ _id: { $in: ids(bag) }, status: 'RETURNED' })).toBe(2);

    // Reopen a return that was marked by mistake.
    expect((await set('WITH_MEMBER')).status).toBe(200);
    const reopened = await Borrow.find({ _id: { $in: ids(bag) } });
    expect(reopened.every((b) => b.status === 'ACTIVE' && !b.returnDate && b.dueDate)).toBe(true);

    // Back to packing: nothing delivered, so no due date.
    expect((await set('PREPARING')).status).toBe(200);
    const packing = await Borrow.find({ _id: { $in: ids(bag) } });
    expect(packing.every((b) => b.fulfilment === 'PREPARING' && !b.dueDate && !b.deliveredAt)).toBe(true);

    // Straight to a pickup: delivery is implied, so a due date appears.
    expect((await set('PICKUP_SCHEDULED')).status).toBe(200);
    const pickup = await Borrow.find({ _id: { $in: ids(bag) } });
    expect(pickup.every((b) => b.returnRequested && b.dueDate)).toBe(true);
  });

  it('is admin-only', async () => {
    const member = await makeUser();
    const bag = await makeHeldBag(member._id, 1);
    const res = await request(app).post('/api/borrows/set-stage').set('Cookie', cookieFor(member))
      .send({ borrowIds: ids(bag), fulfilment: 'COLLECTED' });
    expect(res.status).toBe(403);
  });
});

describe('admin places an order for a member', () => {
  it('goes past the monthly quota and the one-order rule', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const member = await makeUser();
    await makeMembership(member._id, { monthlyTotalLimit: 1 });
    const [first, second, third] = await Promise.all([makeBook(), makeBook(), makeBook()]);

    // The member spends the month's single slot…
    const own = await request(app).post('/api/borrows/request').set('Cookie', cookieFor(member))
      .send({ bookIds: [String(first._id)] });
    expect(own.status).toBe(201);

    // …and the admin still sends two more in one bag.
    const res = await request(app).post('/api/borrows').set('Cookie', cookieFor(admin))
      .send({ userId: String(member._id), bookIds: [String(second._id), String(third._id)] });
    expect(res.status).toBe(201);
    expect(res.body.borrows).toHaveLength(2);
    expect(new Set(res.body.borrows.map((b: any) => b.issueDate)).size).toBe(1);
    expect(await Borrow.countDocuments({ userId: member._id })).toBe(3);
  });

  it('still refuses a copy the library does not have', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const member = await makeUser();
    await makeMembership(member._id);
    const book = await makeBook({ totalCopies: 1 });
    await Borrow.create({
      userId: (await makeUser())._id, bookId: book._id, cycleMonth: 1, cycleYear: 2026, status: 'ACTIVE',
    });

    const res = await request(app).post('/api/borrows').set('Cookie', cookieFor(admin))
      .send({ userId: String(member._id), bookIds: [String(book._id)] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/currently unavailable/);
  });
});
