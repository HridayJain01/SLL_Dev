import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Borrow from '../models/Borrow.js';
import { makeUser, makeBook, makeMembership, cookieFor } from './helpers.js';

/**
 * Regression tests for the check-then-act race in `requestBooks`.
 *
 * Availability and quota were both read, checked, and then written to in separate
 * steps. Two orders arriving together each saw the pre-write count and both
 * succeeded — overselling a copy the library does not have, or letting a member
 * past their monthly allowance. Both reads now sit inside one transaction.
 */
describe('placing an order is atomic', () => {
  it('gives the last copy to exactly one of two simultaneous members', async () => {
    const book = await makeBook({ totalCopies: 1 });

    const [a, b] = await Promise.all([makeUser(), makeUser()]);
    await Promise.all([makeMembership(a._id), makeMembership(b._id)]);

    const order = (user: typeof a) =>
      request(app)
        .post('/api/borrows/request')
        .set('Cookie', cookieFor(user))
        .send({ bookIds: [String(book._id)] });

    const results = await Promise.all([order(a), order(b)]);
    const statuses = results.map((r) => r.status).sort();

    expect(statuses).toEqual([201, 400]);

    // The database has to agree with the HTTP answer: one copy, one borrow row.
    expect(await Borrow.countDocuments({ bookId: book._id })).toBe(1);

    const loser = results.find((r) => r.status === 400)!;
    expect(loser.body.message).toMatch(/not available|currently unavailable/i);
  });

  it('honours totalCopies when several members pile onto a short stack', async () => {
    const book = await makeBook({ totalCopies: 2 });

    const users = await Promise.all([makeUser(), makeUser(), makeUser(), makeUser()]);
    await Promise.all(users.map((u) => makeMembership(u._id)));

    const results = await Promise.all(
      users.map((u) =>
        request(app)
          .post('/api/borrows/request')
          .set('Cookie', cookieFor(u))
          .send({ bookIds: [String(book._id)] })
      )
    );

    expect(results.filter((r) => r.status === 201)).toHaveLength(2);
    expect(await Borrow.countDocuments({ bookId: book._id })).toBe(2);
  });

  it('does not let a double-tapped Submit spend the same quota twice', async () => {
    // Star Reader allows 8 items a month. Two concurrent 5-book orders are 10.
    const user = await makeUser();
    await makeMembership(user._id, { plan: 'STAR_READER', monthlyTotalLimit: 8 });

    const books = await Promise.all(
      Array.from({ length: 5 }, () => makeBook({ totalCopies: 5 }))
    );
    const bookIds = books.map((b) => String(b._id));

    const submit = () =>
      request(app)
        .post('/api/borrows/request')
        .set('Cookie', cookieFor(user))
        .send({ bookIds });

    const results = await Promise.all([submit(), submit()]);

    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(await Borrow.countDocuments({ userId: user._id })).toBe(5);

    const rejected = results.find((r) => r.status === 400)!;
    expect(rejected.body.message).toMatch(/per month/i);
  });

  it('rejects a plan that does not cover the item, without creating rows', async () => {
    const user = await makeUser();
    await makeMembership(user._id, { plan: 'LITTLE_READER', monthlyTotalLimit: null });
    const puzzle = await makeBook({ kind: 'puzzle', planAccess: [], totalCopies: 5 });

    const res = await request(app)
      .post('/api/borrows/request')
      .set('Cookie', cookieFor(user))
      .send({ bookIds: [String(puzzle._id)] });

    expect(res.status).toBe(400);
    expect(await Borrow.countDocuments({})).toBe(0);
  });

  it('refuses an order from a member with no phone or delivery address', async () => {
    const book = await makeBook();
    const member = await makeUser({ phone: '', addresses: [] });
    await makeMembership(member._id);

    const res = await request(app)
      .post('/api/borrows/request')
      .set('Cookie', cookieFor(member))
      .send({ bookIds: [String(book._id)] });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/mobile number and a delivery address/);
    expect(await Borrow.countDocuments({ userId: member._id })).toBe(0);
  });
});
