import React from 'react';
import { GraduationCap, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

// Page shell shared by login, register, forgot and reset password.
export const AuthLayout = ({ title, subtitle, children, footer }) => (
  <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
    <Navbar />
    <main className="flex-1 flex items-center justify-center px-4 pt-28 pb-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          {children}
        </div>

        {footer && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">{footer}</div>
        )}
      </div>
    </main>
    <Footer />
  </div>
);

export const AuthInput = ({ id, label, labelRight, icon: Icon, rightElement, error, ...props }) => (
  <div>
    {(label || labelRight) && (
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {labelRight}
      </div>
    )}
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      )}
      <input
        id={id}
        aria-invalid={!!error}
        className={`block w-full py-2.5 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
          Icon ? 'pl-10' : 'pl-3'
        } ${rightElement ? 'pr-10' : 'pr-3'} ${
          error ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
        }`}
        {...props}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
      )}
    </div>
    {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
  </div>
);

export const Alert = ({ type = 'error', children }) => {
  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle;
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
        isError
          ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
      }`}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
};

export const SubmitButton = ({ loading, loadingText, children, disabled }) => (
  <button
    type="submit"
    disabled={loading || disabled}
    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    {loading ? loadingText : children}
  </button>
);

// Turns an axios error into a readable message. Handles the backend's
// validation shape ({ message, errors: [{ field, errors: [...] }] }) and
// network failures.
export const getApiError = (err, fallback = 'Something went wrong. Please try again.') => {
  if (!err?.response) {
    return 'Cannot reach the server. Check your connection and try again.';
  }
  const body = err.response.data;
  if (Array.isArray(body?.errors) && body.errors.length) {
    return body.errors.flatMap((e) => e.errors || []).join('. ');
  }
  if (Array.isArray(body?.message)) return body.message.join('. ');
  return body?.message || fallback;
};
