import React, { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, WifiOff, X } from 'lucide-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const OfflineBanner = () => {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [message, setMessage] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const goOffline = () => {
      setOffline(true);
      setDismissed(false);
      setMessage('You are offline. Some cached pages may still work.');
    };
    const goOnline = () => {
      setOffline(false);
      setMessage('');
    };
    const service = (event) => {
      setOffline(true);
      setDismissed(false);
      setMessage(
        event.detail?.message ||
          'TweackTech is temporarily unavailable. Your data is safe — retry in a moment.',
      );
    };

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    window.addEventListener('tweack:offline', service);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
      window.removeEventListener('tweack:offline', service);
    };
  }, []);

  const retry = async () => {
    setRetrying(true);
    try {
      const response = await fetch(`${API_URL}/health`, { cache: 'no-store' });
      const body = await response.json().catch(() => ({}));
      if (response.ok && body?.status === 'ok') {
        setOffline(false);
        setMessage('');
        window.dispatchEvent(new Event('tweack:online'));
      }
    } catch {
      // stay offline
    } finally {
      setRetrying(false);
    }
  };

  if (!offline || dismissed) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b border-amber-300/70 bg-amber-50/95 px-4 py-2 text-amber-950 shadow-lg backdrop-blur dark:border-amber-900/60 dark:bg-amber-950/90 dark:text-amber-100">
      <div className="mx-auto flex max-w-7xl items-center gap-3 text-sm">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-amber-200/70 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
          {navigator.onLine ? <AlertTriangle className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        </span>
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">Connection trouble.</strong>{' '}
          <span className="text-amber-800 dark:text-amber-200">
            {message || 'TweackTech is temporarily unavailable.'}
          </span>
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={retrying}
          className="hidden items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 sm:inline-flex dark:border-amber-800 dark:hover:bg-amber-900/50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Checking…' : 'Retry'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="rounded-lg p-1.5 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          aria-label="Dismiss connection warning"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;
