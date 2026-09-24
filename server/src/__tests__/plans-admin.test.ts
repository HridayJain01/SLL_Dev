import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import Membership from '../models/Membership.js';
import { cookieFor, makeMembership, makeUser } from './helpers.js';

const price = (p: number) => ({ price: p, savings: 0 });
const edit = {
  subtitle: 'Now with more books',
  badge: '',
  features: ['6 books per month'],
  excludedFeatures: ['Puzzles'],
  pricing: { '1': price(500), '3': price(1400), '6': price(2600), '12': price(5000) },
  monthlyBookLimit: 6,
  monthlyPuzzleLimit: 0,
  monthlyTotalLimit: null,
};

describe('admin plan editing', () => {
  it('saves the plan and moves existing members onto the new allowance', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const member = await makeUser();
    await makeMembership(member._id, {
      plan: 'LITTLE_READER', booksPerCycle: 5, monthlyBookLimit: 5, monthlyPuzzleLimit: 0, monthlyTotalLimit: null,
    });

    const res = await request(app).put('/api/plans/LITTLE_READER').set('Cookie', cookieFor(admin)).send(edit);
    expect(res.status).toBe(200);
    expect(res.body.membersUpdated).toBe(1);

    const listed = await request(app).get('/api/plans');
    expect(listed.body.plans).toMatchObject([{ code: 'LITTLE_READER', subtitle: 'Now with more books', monthlyBookLimit: 6 }]);

    const m = await Membership.findOne({ userId: member._id }).lean();
    expect(m).toMatchObject({ monthlyBookLimit: 6, monthlyPuzzleLimit: 0, booksPerCycle: 6 });
  });

  it('refuses a plan with no book or total cap', async () => {
    const admin = await makeUser({ role: 'ADMIN' });
    const res = await request(app)
      .put('/api/plans/LITTLE_READER')
      .set('Cookie', cookieFor(admin))
      .send({ ...edit, monthlyBookLimit: null });
    expect(res.status).toBe(400);
  });

  it('is admin-only and rejects unknown plans', async () => {
    const member = await makeUser();
    const admin = await makeUser({ role: 'ADMIN' });
    expect((await request(app).put('/api/plans/LITTLE_READER').set('Cookie', cookieFor(member)).send(edit)).status).toBe(403);
    expect((await request(app).put('/api/plans/GOLD').set('Cookie', cookieFor(admin)).send(edit)).status).toBe(404);
  });
});
