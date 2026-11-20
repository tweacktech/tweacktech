import React, { useEffect } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';

export const PageHeader = ({ title, description, actions }) => (
  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatCard = ({ label, value, hint, icon: Icon, tone = 'red' }) => {
  const tones = {
    red: 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',
    blue: 'bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    green: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400',
  };
  return (
    <div className="stat-card card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        {Icon && (
          <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone] || tones.red}`}>
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
};

export const Loading = ({ label = 'Loading…' }) => (
  <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500 dark:text-slate-400">
    <Loader2 className="h-5 w-5 animate-spin text-red-600" />
    {label}
  </div>
);

export const ErrorBox = ({ message }) =>
  message ? (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  ) : null;

export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="card flex flex-col items-center justify-center gap-3 p-12 text-center">
    {Icon && (
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
        <Icon className="h-6 w-6" />
      </span>
    )}
    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
    {description && (
      <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p>
    )}
    {action}
  </div>
);

export const Modal = ({ open, title, description, onClose, children, wide = false }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay fixed inset-0 z-[80] bg-slate-950/60">
      <div
        className={`modal-card w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'} border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 scale-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="modal-body px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </div>
  );
};

export const Field = ({ label, htmlFor, hint, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label htmlFor={htmlFor} className="label">
        {label}
      </label>
    )}
    {children}
    {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
  </div>
);

export const Toggle = ({ checked, onChange, label }) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
    />
    {label}
  </label>
);

export const Pagination = ({ meta, onPage }) => {
  if (!meta || meta.totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 pt-4 text-sm text-slate-500 dark:text-slate-400">
      <span>
        Page {meta.page} of {meta.totalPages} · {meta.total} total
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={meta.page <= 1}
          onClick={() => onPage(meta.page - 1)}
          className="btn-secondary !px-3 !py-1.5 disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={meta.page >= meta.totalPages}
          onClick={() => onPage(meta.page + 1)}
          className="btn-secondary !px-3 !py-1.5 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
};

export const formatMoney = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined || amount === '') return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
};
