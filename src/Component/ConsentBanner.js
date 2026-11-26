import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';
import {
  OPEN_CONSENT_EVENT,
  readConsent,
  saveConsent,
} from '../lib/consent';

/**
 * Non-blocking consent banner. Shown until the visitor makes a choice, and
 * re-openable from the footer ("Cookie settings").
 */
const ConsentBanner = () => {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!readConsent()) setVisible(true);
    const reopen = () => {
      setExpanded(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!visible) return null;

  const choose = (analytics, ads) => {
    saveConsent({ analytics, ads });
    setVisible(false);
    setExpanded(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie and advertising preferences"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
          <Cookie className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            Your privacy, your choice
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            We use essential cookies to keep you signed in. With your permission
            we also use advertising cookies to keep TweackTech free. You can
            change this any time from the footer.{' '}
            <Link to="/cookies" className="font-semibold text-red-600 underline dark:text-red-400">
              Cookie policy
            </Link>
          </p>

          {expanded && (
            <ul className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Essential</strong> — always
                on. Sign-in, security and your saved preferences.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Advertising</strong> — lets
                Google AdSense show relevant ads. Declining keeps non-targeted ads only.
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">Analytics</strong> — helps us
                see which lessons need work. Currently off unless you accept.
              </li>
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => choose(true, true)}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => choose(false, false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Essential only
            </button>
            {!expanded && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="text-xs font-semibold text-slate-500 underline dark:text-slate-400"
              >
                What does this mean?
              </button>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss and use essential cookies only"
          onClick={() => choose(false, false)}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ConsentBanner;
