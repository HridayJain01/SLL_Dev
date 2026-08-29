import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';

/**
 * Cheap proof that the routes are actually mounted where callers expect them.
 * A route can typecheck perfectly and still be unreachable because of mount
 * order or a missing `/api` prefix.
 */
describe('route mounting', () => {
  it('serves the liveness probe', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('exposes the new auth routes', async () => {
    for (const path of ['/api/auth/forgot-password', '/api/auth/reset-password']) {
      const res = await request(app).post(path).send({});
      expect(res.status, path).not.toBe(404);
    }
  });

  it('exposes the cron route', async () => {
    const res = await request(app).get('/api/notifications/cron/reminders');
    expect(res.status).not.toBe(404);
  });

  it('caps oversized request bodies', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a'.repeat(2 * 1024 * 1024) }));
    expect(res.status).toBe(413);
  });
});
