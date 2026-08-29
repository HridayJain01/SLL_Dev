import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

// `withCredentials` sends the httpOnly session cookie. There is no Authorization
// header to attach — the token is deliberately never held in JS-readable storage.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // A 401 from an auth route is the answer to a question the page asked —
    // wrong password, or an account the server won't seat. Redirecting there
    // reloads the page before the form can show why it failed. Only a 401 on a
    // *different* route means an established session went stale.
    const url = err.config?.url ?? '';
    const isAuthAttempt = url.startsWith('/auth/') && !url.startsWith('/auth/me');

    if (err.response?.status === 401 && !isAuthAttempt) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
