import React from 'react';
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react';

const isChunkLoadError = (error) =>
  /loading chunk|chunkloaderror|failed to fetch dynamically imported module|error importing a module/i.test(
    String(error?.message || error || ''),
  );

const isOfflineFailure = (error) =>
  !navigator.onLine ||
  isChunkLoadError(error) ||
  /network error|failed to fetch|offline|err_network/i.test(String(error?.message || error || ''));

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, offline: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, offline: isOfflineFailure(error) };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
  }

  handleOnline = () => {
    // An offline error should heal itself as soon as the connection returns.
    if (this.state.offline) window.location.reload();
  };

  componentDidCatch(error, info) {
    // Keep the console useful in development without exposing a blank screen.
    // eslint-disable-next-line no-console
    console.error('TweackTech UI error:', error, info);
  }

  render() {
    const { hasError, offline } = this.state;
    if (hasError) {
      if (offline) {
        return (
          <div className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
            <div className="card max-w-md p-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <WifiOff className="h-7 w-7" />
              </span>
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                You are offline
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This page could not load while your connection was down. Your data is safe — we will
                reopen it automatically when you are back online.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  <RefreshCw className="h-4 w-4" /> Retry now
                </button>
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="grid min-h-screen place-items-center bg-slate-50 p-6 dark:bg-slate-950">
          <div className="card max-w-md p-8 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
              <AlertTriangle className="h-7 w-7" />
            </span>
            <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Something went wrong on this page
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Your data is safe. Reload the page or go back to the dashboard.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                <RefreshCw className="h-4 w-4" /> Reload
              </button>
              <a href="/dashboard" className="btn-secondary">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
