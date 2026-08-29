import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { makeUser, cookieFor } from './helpers.js';

/**
 * Regression test for a live hole: `protect` used to load the user and call
 * `next()` without ever looking at `status`. Login refused PENDING and SUSPENDED
 * accounts, but a member suspended *after* signing in kept a working session —
 * admin routes included — until their 7-day token expired on its own.
 */
describe('protect re-checks account status on every request', () => {
  it('lets an active member through', async () => {
    const user = await makeUser({ status: 'ACTIVE' });
    const res = await request(app).get('/api/users/me').set('Cookie', cookieFor(user));
    expect(res.status).toBe(200);
  });

  it('rejects a token minted before the account was suspended', async () => {
    const user = await makeUser({ status: 'ACTIVE' });
    const cookie = cookieFor(user); // issued while the account was still good

    await user.updateOne({ status: 'SUSPENDED' });

    const res = await request(app).get('/api/users/me').set('Cookie', cookie);
    // 401 rather than 403 so the client's axios interceptor clears the session.
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Account suspended');
  });

  it('rejects an account still awaiting admin approval', async () => {
    const user = await makeUser({ status: 'PENDING' });
    const res = await request(app).get('/api/users/me').set('Cookie', cookieFor(user));
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Account pending admin approval');
  });

  it('still lets a self-paused member back in to un-pause', async () => {
    // `deactivatedAt` is a self-service pause and reactivation is itself behind
    // `protect`. Blocking on it here would strand the member with no way back.
    const user = await makeUser({ status: 'ACTIVE', deactivatedAt: new Date() });
    const res = await request(app).get('/api/users/me').set('Cookie', cookieFor(user));
    expect(res.status).toBe(200);
  });

  it('refuses a request carrying no token at all', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});
