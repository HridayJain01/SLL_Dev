/**
 * Browser error reporting, off unless VITE_SENTRY_DSN is set at build time.
 *
 * The SDK is imported dynamically, so it is a separate chunk that is never
 * downloaded without a DSN, and never sits in the entry bundle even with one.
 */
type SentryModule = typeof import('./sentry');

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
let sentry: Promise<SentryModule | null> | undefined;

function load() {
  if (!dsn) return Promise.resolve(null);
  sentry ??= import('./sentry')
    .then((S) => {
      // defaultIntegrations off: they are what pull in the bulk of the SDK. The
      // one we do want is the global handlers -- window.onerror and unhandled
      // promise rejections -- which is how uncaught errors get reported at all.
      S.init({
        dsn,
        environment: import.meta.env.MODE,
        defaultIntegrations: false,
        integrations: [S.globalHandlersIntegration()],
      });
      return S;
    })
    .catch(() => null);
  return sentry;
}

/** Start the SDK after first paint so it picks up uncaught errors globally. */
export function initMonitoring() {
  if (!dsn) return;
  const start = () => void load();
  // Capped: without a timeout, idle callbacks can be postponed indefinitely on
  // a busy or background tab, leaving early errors unreported.
  if ('requestIdleCallback' in window) window.requestIdleCallback(start, { timeout: 3000 });
  else setTimeout(start, 2000);
}

/** Report an error React caught (the SDK's global handlers never see those). */
export function reportError(error: unknown, extra?: Record<string, unknown>) {
  void load().then((S) => S?.captureException(error, extra ? { extra } : undefined));
}
