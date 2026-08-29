import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

/**
 * Google's own rendered sign-in button, wired to `POST /auth/google`.
 *
 * This is the Google Identity Services ID-token flow rather than a redirect
 * dance: Google hands the page a signed ID token, we post it, and the server
 * verifies it and returns the same session token the password login issues. So
 * everything downstream — the auth store, the cookie, the guards — is untouched.
 *
 * The button is Google's rendered widget on purpose. It carries their branding
 * requirements, the localisation and the account-picker behaviour, none of which
 * a hand-rolled button would get right.
 */

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/** Minimal surface of the GIS client we actually call. */
type GoogleIdApi = {
  initialize(config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'small' | 'medium' | 'large';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signup';
      width?: number;
      logo_alignment?: 'left' | 'center';
    }
  ): void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

/**
 * Loaded on demand rather than from a tag in index.html, so Google's script is
 * only fetched on the two pages that offer the button. Cached at module level
 * because both auth pages mount the component and the script must load once.
 */
let gsiLoader: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (gsiLoader) return gsiLoader;
  gsiLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('load failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later mount retry rather than caching the failure forever.
      gsiLoader = null;
      reject(new Error('load failed'));
    };
    document.head.appendChild(script);
  });
  return gsiLoader;
}

/** Google caps the rendered button at 400px; the auth column's inner width is 404px. */
const BUTTON_WIDTH = 400;

export default function GoogleButton({
  text = 'signin_with',
}: {
  /** "Sign in with Google" on the login page, "Sign up with Google" on signup. */
  text?: 'signin_with' | 'signup_with';
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const containerRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setToken);

  // The callback is handed to Google once, so it must not close over stale
  // state. It only uses store setters and the navigate function, both stable.
  useEffect(() => {
    if (!clientId || !containerRef.current) return;
    let cancelled = false;

    const onCredential = async (response: { credential?: string }) => {
      if (!response.credential) {
        toast.error('Google did not return a sign-in token');
        return;
      }
      try {
        const res = await api.post('/auth/google', { credential: response.credential });
        setUser(res.data.user);
        setToken(res.data.token || null);
        toast.success('Logged in successfully');
        navigate(res.data.user?.role === 'ADMIN' ? '/admin' : '/account');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Google sign-in failed');
      }
    };

    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const idApi = window.google?.accounts?.id;
        if (!idApi) {
          setUnavailable(true);
          return;
        }
        idApi.initialize({ client_id: clientId, callback: onCredential });
        idApi.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text,
          width: BUTTON_WIDTH,
          logo_alignment: 'center',
        });
      })
      .catch(() => {
        if (!cancelled) setUnavailable(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, text]);

  // Not configured: show nothing rather than a button that cannot work. The
  // hint is dev-only so a missing key is obvious while building.
  if (!clientId) {
    return import.meta.env.DEV ? (
      <p className="mt-[18px] text-center font-body text-[11px] font-medium text-[#6b6f85]">
        Google sign-in hidden — set <code>VITE_GOOGLE_CLIENT_ID</code> in{' '}
        <code>client/.env</code>
      </p>
    ) : null;
  }

  return (
    <div className="mt-[18px] flex flex-col items-center">
      <div className="flex w-full items-center gap-3 px-[19px]">
        <span className="h-px flex-1 bg-black/15" />
        <span className="font-body text-[11px] font-medium uppercase tracking-[0.08em] text-[#6b6f85]">
          or
        </span>
        <span className="h-px flex-1 bg-black/15" />
      </div>

      {/* Google renders an iframe in here; it is centred rather than stretched
          because the widget will not exceed 400px. */}
      <div ref={containerRef} className="mt-[14px] flex min-h-[44px] justify-center" />

      {unavailable && (
        <p className="mt-[8px] text-center font-body text-[11px] font-medium text-[#6b6f85]">
          Google sign-in is unavailable right now. Use your email and password.
        </p>
      )}
    </div>
  );
}
