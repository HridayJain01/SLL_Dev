import type * as SentryNode from '@sentry/node';

/**
 * Error reporting, off unless SENTRY_DSN is set.
 *
 * The SDK is imported lazily on the first error rather than at boot, so a
 * deployment without a DSN pays nothing for it -- this runs as a serverless
 * function where every import is cold-start time.
 */
let sentry: Promise<typeof SentryNode | null> | undefined;

function load() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return Promise.resolve(null);

  sentry ??= import('@sentry/node')
    .then((S) => {
      S.init({ dsn, environment: process.env.NODE_ENV ?? 'development', tracesSampleRate: 0 });
      return S;
    })
    .catch((err) => {
      console.error('[monitoring] could not start Sentry:', (err as Error).message);
      return null;
    });
  return sentry;
}

/**
 * Report an unexpected error. Never throws.
 *
 * Flushes before returning: on Vercel the function can be frozen the moment the
 * response is sent, which would drop an event still sitting in the queue.
 */
export async function reportError(err: unknown, context?: Record<string, unknown>) {
  const S = await load();
  if (!S) return;
  try {
    S.captureException(err, context ? { extra: context } : undefined);
    await S.flush(2000);
  } catch {
    // Reporting must never be the thing that breaks a response.
  }
}
