import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// A failed lazy import (offline, stale chunk after a deploy) surfaces as an
// unhandled rejection. Surface it through the connection banner instead of a
// generic error, and keep the current screen usable.
window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event.reason?.message || event.reason || '');
  if (!/loading chunk|chunkloaderror|dynamically imported module|network error|failed to fetch/i.test(reason)) {
    return;
  }
  event.preventDefault();
  window.dispatchEvent(
    new CustomEvent('tweack:offline', {
      detail: {
        code: 'OFFLINE_CHUNK',
        message: 'A page could not load. Reconnect and we will fetch it automatically.',
      },
    }),
  );
});

// Belt-and-braces offline setup: if the worker's install was interrupted
// (tab closed mid-precache), finish caching the build assets from the page.
const ensureOfflineAssets = async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active;
    if (!worker) return;
    const response = await fetch('/sw-assets.json', { cache: 'no-store' });
    if (!response.ok) return;
    const manifest = await response.json();
    if (Array.isArray(manifest.urls) && manifest.urls.length) {
      worker.postMessage({ type: 'CACHE_URLS', urls: manifest.urls });
    }
  } catch {
    // Offline support is best-effort; the app itself still works.
  }
};
ensureOfflineAssets();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
