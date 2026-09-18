import { describe, it, expect, vi, afterEach } from 'vitest';
import { sendEmail } from '../lib/email/mailer.js';

// No SMTP is configured in tests, so sendEmail takes the log-instead-of-send path.
const content = {
  subject: 'Reset your password',
  html: '<p>x</p>',
  text: 'Open http://localhost/reset-password?token=SECRET-TOKEN',
};
const env = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = env;
  vi.restoreAllMocks();
});

function logged() {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  return () => info.mock.calls.flat().join('\n');
}

describe('sendEmail without SMTP', () => {
  it('prints the body locally, so links in it can be followed', async () => {
    process.env.NODE_ENV = 'development';
    const output = logged();
    expect(await sendEmail('a@example.com', content)).toBe(false);
    expect(output()).toContain('SECRET-TOKEN');
  });

  it('never prints the body on Vercel, even with NODE_ENV=development', async () => {
    process.env.NODE_ENV = 'development';
    process.env.VERCEL = '1';
    const output = logged();
    await sendEmail('a@example.com', content);
    delete process.env.VERCEL;
    expect(output()).not.toContain('SECRET-TOKEN');
  });

  it('fails closed when NODE_ENV is unset', async () => {
    delete process.env.NODE_ENV;
    const output = logged();
    await sendEmail('a@example.com', content);
    expect(output()).not.toContain('SECRET-TOKEN');
  });

  it('never prints the body in production, where logs are shared', async () => {
    process.env.NODE_ENV = 'production';
    const output = logged();
    await sendEmail('a@example.com', content);
    expect(output()).toContain('Reset your password');
    expect(output()).not.toContain('SECRET-TOKEN');
  });
});
