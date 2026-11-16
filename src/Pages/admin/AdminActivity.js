import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import {
  EmptyState,
  ErrorBox,
  Loading,
  PageHeader,
  Pagination,
  formatDateTime,
} from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const toneFor = (action = '') => {
  if (action.startsWith('auth.login')) return 'badge-success';
  if (action.startsWith('auth')) return 'badge-warning';
  if (action.includes('deleted')) return 'badge-danger';
  if (action.startsWith('attendance')) return 'badge-success';
  if (action.startsWith('payments')) return 'badge-info';
  if (action.startsWith('mentors')) return 'badge-warning';
  return 'badge-neutral';
};

const AdminActivity = () => {
  const { api } = useAuth();
  const [logs, setLogs] = useState([]);
  const [actions, setActions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const searchRef = useRef(search);
  searchRef.current = search;

  const load = useCallback(
    async (nextPage = page, quiet = false) => {
      if (quiet) setRefreshing(true);
      else setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(nextPage), limit: '25' });
        if (searchRef.current.trim()) params.set('search', searchRef.current.trim());
        if (action) params.set('action', action);
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        const body = unwrap(await api.get(`/activity?${params.toString()}`)) || {};
        setLogs(body.logs || []);
        setActions(body.actions || []);
        setMeta(body.meta || { page: nextPage, totalPages: 1, total: 0 });
      } catch (err) {
        setError(
          err?.response?.status === 403
            ? 'Activity logs are available to admins only.'
            : 'Unable to load the activity log right now.',
        );
        setLogs([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [api, page, action, from, to],
  );

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, action, from, to]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      load(1);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Activity log"
        description="A complete audit trail of what admins, staff and learners do across TweackTech."
        actions={
          <>
            <button
              type="button"
              onClick={() => load(page, true)}
              disabled={refreshing}
              className="btn-secondary"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <span className="inline-flex items-center gap-1.5 self-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" /> Live monitoring
            </span>
          </>
        }
      />

      {error && <ErrorBox message={error} />}

      <div className="card p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr,220px,160px,160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search actor, action, description or path…"
              className="input-field pl-10"
              aria-label="Search activity"
            />
          </div>
          <select
            value={action}
            onChange={(event) => {
              setPage(1);
              setAction(event.target.value);
            }}
            className="input-field"
            aria-label="Filter by action"
          >
            <option value="">All actions</option>
            {actions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div>
            <label htmlFor="activity-from" className="sr-only">
              From date
            </label>
            <input
              id="activity-from"
              type="date"
              value={from}
              onChange={(event) => {
                setPage(1);
                setFrom(event.target.value);
              }}
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="activity-to" className="sr-only">
              To date
            </label>
            <input
              id="activity-to"
              type="date"
              value={to}
              onChange={(event) => {
                setPage(1);
                setTo(event.target.value);
              }}
              className="input-field"
            />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 font-semibold dark:bg-slate-800">
            <Activity className="h-3.5 w-3.5" /> {meta.total || 0} events
          </span>
          {(search || action || from || to) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setAction('');
                setFrom('');
                setTo('');
                setPage(1);
              }}
              className="font-semibold text-red-600 hover:underline dark:text-red-400"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loading label="Loading activity…" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity found"
          description="Events appear here automatically whenever someone creates, updates or deletes something."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[160px,1fr,150px,150px] gap-4 border-b border-slate-100 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-800 lg:grid">
            <span>Actor</span>
            <span>What happened</span>
            <span>Action</span>
            <span>When</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <details key={log.id} className="group px-4 py-3 sm:px-5">
                <summary className="flex cursor-pointer list-none flex-col gap-2 lg:grid lg:grid-cols-[160px,1fr,150px,150px] lg:items-center lg:gap-4">
                  <div className="flex items-center gap-2.5">
                    {log.actor?.avatar ? (
                      <img src={log.actor.avatar} alt="" className="h-8 w-8 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {log.actorName
                          ? log.actorName
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')
                          : '—'}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                        {log.actorName || 'System'}
                      </p>
                      <p className="text-[11px] text-slate-400">{log.actorRole || 'automation'}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {log.description || log.action}
                    </p>
                    {log.path && (
                      <p className="truncate font-mono text-[11px] text-slate-400">
                        {log.method} {log.path}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={toneFor(log.action)}>{log.action}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition group-open:rotate-180" />
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 lg:text-xs">
                    {formatDateTime(log.createdAt)}
                  </div>
                </summary>
                <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <p className="text-slate-500 dark:text-slate-400">
                      Entity: <span className="font-semibold text-slate-700 dark:text-slate-200">{log.entityType || '—'}</span>
                    </p>
                    <p className="truncate text-slate-500 dark:text-slate-400">
                      ID: <span className="font-mono text-slate-700 dark:text-slate-200">{log.entityId || '—'}</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      Status:{' '}
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                        {log.statusCode && log.statusCode < 400 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                        {log.statusCode || '—'}
                      </span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                      IP: <span className="font-mono text-slate-700 dark:text-slate-200">{log.ip || '—'}</span>
                    </p>
                  </div>
                  {log.metadata && (
                    <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-slate-200">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {!loading && logs.length > 0 && (
        <Pagination meta={meta} onPage={(next) => setPage(next)} />
      )}
    </div>
  );
};

export default AdminActivity;
