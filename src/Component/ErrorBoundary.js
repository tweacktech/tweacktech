import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Keep the console useful in development without exposing a blank screen.
    // eslint-disable-next-line no-console
    console.error('TweackTech UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
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
