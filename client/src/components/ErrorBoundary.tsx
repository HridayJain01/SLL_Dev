import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { reportError } from '@/lib/monitoring';

/**
 * Last line of defence around the router.
 *
 * Without one, a single render-time throw anywhere in the tree unmounts
 * everything and leaves a blank white page with no way forward. This keeps the
 * brand on screen and offers the two things that actually help: reload, or go
 * home.
 *
 * Has to be a class — there is still no hook equivalent of componentDidCatch.
 * Note it only catches render/lifecycle errors, not those thrown inside event
 * handlers or async callbacks; those surface through the toaster instead.
 */
type Props = { children: ReactNode };
type State = { error: Error | null };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
    // React swallows render errors before the global handlers see them, so
    // this is the only path by which they reach Sentry.
    reportError(error, { componentStack: info.componentStack });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <img src="/peeking-star.png" alt="" className="h-24 w-24 object-contain" />
        <h1 className="font-heading text-[32px] font-extrabold text-black">
          Something went wrong
        </h1>
        <p className="max-w-[420px] font-body text-[15px] text-[#6b6f85]">
          Sorry — that page ran into a problem. Reloading usually sorts it out.
        </p>
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="h-[44px] rounded-full bg-primary px-6 font-body text-[14px] font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Reload the page
          </button>
          <a
            href="/"
            className="flex h-[44px] items-center rounded-full border border-black px-6 font-body text-[14px] font-medium text-black transition-colors hover:bg-black hover:text-white"
          >
            Go home
          </a>
        </div>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-w-[600px] overflow-auto rounded-lg bg-black/5 p-4 text-left font-mono text-[11px] text-black/70">
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
