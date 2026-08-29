import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import app from '../app.js';
import User from '../models/User.js';
import { makeUser } from './helpers.js';
import { emailService } from '../lib/email/index.js';

const sent = vi.spyOn(emailService, 'passwordReset');

beforeEach(() => {
  sent.mockClear();
  sent.mockResolvedValue(true);
});

/** Pull the raw token out of the link the member was emailed. */
function tokenFromLastEmail(): string {
  const url = sent.mock.calls.at(-1)![2];
  return new URL(url).searchParams.get('token')!;
}

describe('POST /api/auth/forgot-password', () => {
  it('emails a reset link to a known address', async () => {
    const user = await makeUser({ email: 'known@example.com' });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'known@example.com' });

    expect(res.status).toBe(200);
    expect(sent).toHaveBeenCalledOnce();
    expect(sent.mock.calls[0][0]).toBe('known@example.com');

    // Only the hash is persisted — the raw token lives in the inbox alone.
    const stored = await User.findById(user._id).select('+resetTokenHash +resetTokenExpires');
    const raw = tokenFromLastEmail();
    expect(stored!.resetTokenHash).toBe(crypto.createHash('sha256').update(raw).digest('hex'));
    expect(stored!.resetTokenHash).not.toBe(raw);
    expect(stored!.resetTokenExpires!.getTime()).toBeGreaterThan(Date.now());
  });

  it('gives an unknown address the same answer, and sends nothing', async () => {
    const known = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    // Identical to the success case: this must not reveal who is a member.
    expect(known.status).toBe(200);
    expect(known.body.message).toMatch(/if that email is registered/i);
    expect(sent).not.toHaveBeenCalled();
  });

  it('does not offer a reset for a Google-only account', async () => {
    await makeUser({ email: 'google@example.com', password: undefined, googleId: 'g-1' });

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'google@example.com' });

    expect(res.status).toBe(200);
    expect(sent).not.toHaveBeenCalled();
  });
});

describe('POST /api/auth/reset-password', () => {
  async function startReset(email = 'member@example.com') {
    const user = await makeUser({ email });
    await request(app).post('/api/auth/forgot-password').send({ email });
    return { user, token: tokenFromLastEmail() };
  }

  it('sets a new password that then works for login', async () => {
    const { token } = await startReset();

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'brand-new-password' });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: 'brand-new-password' });
    expect(login.status).toBe(200);
  });

  it('does not sign the member in as a side effect', async () => {
    const { token } = await startReset();
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'brand-new-password' });

    // Holding the link proves inbox access, not intent to be seated.
    expect(res.headers['set-cookie']).toBeUndefined();
    expect(res.body.user).toBeUndefined();
  });

  it('burns the token so a link cannot be replayed', async () => {
    const { token } = await startReset();

    await request(app).post('/api/auth/reset-password').send({ token, password: 'first-choice' });
    const replay = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'second-choice' });

    expect(replay.status).toBe(400);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@example.com', password: 'second-choice' });
    expect(login.status).toBe(401);
  });

  it('refuses an expired token', async () => {
    const { user, token } = await startReset();
    await User.updateOne({ _id: user._id }, { resetTokenExpires: new Date(Date.now() - 1000) });

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'too-late-now' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid or has expired/i);
  });

  it('refuses a made-up token', async () => {
    await startReset();
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'brand-new-password' });
    expect(res.status).toBe(400);
  });

  it('enforces the minimum password length', async () => {
    const { token } = await startReset();
    const res = await request(app).post('/api/auth/reset-password').send({ token, password: 'abc' });
    expect(res.status).toBe(400);
  });
});
