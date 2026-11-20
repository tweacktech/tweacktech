import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ meta, onPage }) => {
  const page = Number(meta?.page || 1);
  const totalPages = Math.max(1, Number(meta?.totalPages || 1));
  const total = Number(meta?.total || 0);
  if (totalPages <= 1 && page <= 1) return null;

  const go = (next) => {
    if (next < 1 || next > totalPages || next === page) return;
    onPage(next);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={page <= 1}
        className="btn-secondary !py-2 disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </button>
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
        Page {page} of {totalPages}
        {total ? <span className="ml-1 text-xs text-slate-400">· {total} results</span> : null}
      </span>
      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={page >= totalPages}
        className="btn-secondary !py-2 disabled:opacity-40"
      >
        Next <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Pagination;
