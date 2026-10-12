import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import App from './App.tsx';
import NotificationPopups from './components/NotificationPopups.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';
import { queryClient } from './lib/queryClient.ts';
import { initMonitoring } from './lib/monitoring.ts';
import './lib/savedSync.ts';

initMonitoring();

if ('serviceWorker' in navigator) void navigator.serviceWorker.register('/sw.js');

// "Install app" offer on browsers that support it (Android/desktop Chrome, Edge).
// iOS has no prompt: there it's Share -> Add to Home Screen.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  const prompt = e as Event & { prompt: () => Promise<void> };
  toast('Get the Star Learners app', {
    description: 'Install it on this device for quick access and notifications.',
    duration: Infinity,
    action: { label: 'Install', onClick: () => void prompt.prompt() },
  });
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
        <NotificationPopups />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
