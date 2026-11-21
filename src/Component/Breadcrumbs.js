import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb navigation with a back button.
 * items: [{ label, to }] — the last item is treated as the current page.
 */
const Breadcrumbs = ({ items = [], showBack = true, className = '' }) => {
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400 ${className}`}
    >
      {showBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
      )}
      <Link to="/" className="inline-flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400">
        <Home className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Home</span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${index}`}>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-red-600 dark:hover:text-red-400">
                {item.label}
              </Link>
            ) : (
              <span className="max-w-[220px] truncate font-medium text-slate-900 dark:text-white">
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
