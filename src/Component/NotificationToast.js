import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';

const NotificationToast = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onNotification = (event) => {
      const detail = event.detail || {};
      const id = detail.id || `${Date.now()}-${Math.random()}`;
      setToasts((prev) => {
        if (prev.some((toast) => toast.id === id)) return prev;
        return [{ ...detail, id }, ...prev].slice(0, 4);
      });
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 6500);
    };
    window.addEventListener('tweack:notification', onNotification);
    return () => window.removeEventListener('tweack:notification', onNotification);
  }, []);

  const dismiss = (id) =>
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-3 top-20 z-[95] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <Bell className="h-4 w-4" />
          </span>
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => {
              if (toast.link) navigate(toast.link);
              dismiss(toast.id);
            }}
          >
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {toast.title || 'New notification'}
            </p>
            {toast.body && (
              <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                {toast.body}
              </p>
            )}
          </button>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Dismiss notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
