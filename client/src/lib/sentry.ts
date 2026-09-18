// Named imports only, and loaded via dynamic import() from monitoring.ts. A
// dynamic import of the '@sentry/react' namespace itself cannot be tree-shaken
// and drags in Replay, tracing and the rest (~460 KB); this keeps just what we use.
export { init, captureException, globalHandlersIntegration } from '@sentry/react';
