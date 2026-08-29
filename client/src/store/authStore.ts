import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IUser } from '@/types';

/**
 * The session itself lives in the httpOnly `token` cookie the server sets, which
 * the browser attaches to every request (axios sends `withCredentials: true`).
 *
 * Only `user` is kept here, and only so the route guards can render without a
 * round-trip. It is a cache of who the server said we are, never proof of it —
 * every API call is re-authorised server-side from the cookie, so editing this
 * in devtools buys nothing but a broken-looking page.
 *
 * The JWT deliberately is NOT stored: a copy in localStorage is readable by any
 * script on the page, which would hand a 7-day full-privilege token to any XSS
 * and undo the point of the httpOnly cookie.
 */
interface AuthState {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      isAdmin: () => get().user?.role === 'ADMIN',
    }),
    {
      name: 'auth-storage',
      // Belt and braces: only ever write `user`, whatever else ends up on the
      // store object.
      partialize: (state) => ({ user: state.user }),
      // v0 persisted the JWT alongside the user. Bumping the version runs this
      // once per browser and drops the stored token instead of leaving it to rot
      // in localStorage on every device that already has one.
      version: 1,
      migrate: (persisted) => ({ user: (persisted as { user?: IUser | null })?.user ?? null }),
    }
  )
);
