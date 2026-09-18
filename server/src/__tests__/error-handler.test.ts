import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
  flush: vi.fn().mockResolvedValue(true),
}));
vi.mock('@sentry/node', () => sentry);

import { errorHandler } from '../middleware/errorHandler.js';

/** A throwaway app whose only route fails the way we tell it to. */
function appThrowing(err: unknown) {
  const app = express();
  app.get('/boom', () => {
    throw err;
  });
  app.use(errorHandler);
  return app;
}

const env = { ...process.env };
beforeEach(() => {
  sentry.init.mockClear();
  sentry.captureException.mockClear();
});
afterEach(() => {
  process.env = { ...env };
});

describe('errorHandler', () => {
  it('hides a 5xx message from the browser in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(appThrowing(new Error('E11000 connection to 10.0.0.4 refused'))).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });

  it('keeps the real message outside production, for debugging', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(appThrowing(new Error('driver exploded'))).get('/boom');
    expect(res.body.message).toBe('driver exploded');
  });

  it('passes 4xx messages through untouched -- those are meant for the user', async () => {
    process.env.NODE_ENV = 'production';
    const err = Object.assign(new Error('Origin not allowed by CORS'), { statusCode: 403 });
    const res = await request(appThrowing(err)).get('/boom');
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Origin not allowed by CORS');
  });

  it('does not load Sentry at all without a DSN', async () => {
    delete process.env.SENTRY_DSN;
    await request(appThrowing(new Error('x'))).get('/boom');
    expect(sentry.init).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it('reports genuine faults to Sentry when a DSN is set', async () => {
    process.env.SENTRY_DSN = 'https://public@example.ingest.sentry.io/1';
    const err = new Error('real fault');
    await request(appThrowing(err)).get('/boom');
    expect(sentry.captureException).toHaveBeenCalledWith(err, expect.objectContaining({ extra: expect.objectContaining({ path: '/boom' }) }));
    expect(sentry.flush).toHaveBeenCalled();
  });

  it('does not report client errors, which would drown the signal', async () => {
    process.env.SENTRY_DSN = 'https://public@example.ingest.sentry.io/1';
    const err = Object.assign(new Error('bad input'), { statusCode: 400 });
    await request(appThrowing(err)).get('/boom');
    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});
