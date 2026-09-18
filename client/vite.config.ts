import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ command, mode }) => {
  // Every "buy this plan" button is a wa.me link to this number -- payment runs
  // over WhatsApp. Unset, it falls back to a placeholder and every purchase link
  // in the build goes nowhere. Warn loudly rather than ship that silently.
  if (command === 'build' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_WHATSAPP_NUMBER) {
    console.warn(
      '\n\x1b[33m[warn] VITE_WHATSAPP_NUMBER is not set. Membership purchase links in this ' +
        'build will point at the placeholder 919XXXXXXXXX. Set it in Vercel env before deploying.\x1b[0m\n'
    );
  }

  return {
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
      // Bind to all interfaces so the dev server is reachable from phones on the same Wi-Fi.
      host: true,
      port: process.env.PORT ? Number(process.env.PORT) : 5173,
      proxy: { '/api': { target: 'http://localhost:5001', changeOrigin: true } },
    },
  };
});
