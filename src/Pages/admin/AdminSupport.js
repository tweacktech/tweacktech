import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  LifeBuoy,
  MessageSquare,
  Search,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { getPusher } from '../../lib/pusher';
import {
  EmptyState,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeader,
  Pagination,
  StatCard,
  formatDateTime,
} from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const priorityBadge = (priority) => {
  if (priority === 'URGENT') return 'badge-danger';
  if (priority === 'HIGH') return 'badge-warning';
  if (priority === 'MEDIUM') return 'badge-info';
  return 'badge-neutral';
};

const AdminSupport = () => {
  const { api } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [active, setActive] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [reply, setReply] = useState('');
  const [internal, setInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (status) params.set('status', status);
      if (priority) params.set('priority', priority);
      const [listRes, statsRes] = await Promise.allSettled([
        api.get(`/support/tickets?${params.toString()}`),
        api.get('/support/stats'),
      ]);
      if (listRes.status === 'fulfilled') {
        const data = unwrap(listRes.value);
        setTickets(data?.tickets || []);
        setMeta(data?.meta || null);
      } else {
        throw listRes.reason;
      }
      if (statsRes.status === 'fulfilled') setStats(unwrap(statsRes.value));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load support tickets.');
    } finally {
      setLoading(false);
    }
  }, [api, page, status, priority]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const pusher = getPusher();
    if (!pusher) return undefined;
    const channel = pusher.subscribe('private-admin');
    const refresh = (data) => {
      load();
      if (data?.subject) {
        window.dispatchEvent(
          new CustomEvent('tweack:notification', {
            detail: {
              id: `support-${Date.now()}`,
              title: 'New support ticket',
              body: data.subject,
              link: '/admin/support',
            },
          }),
        );
      }
    };
    channel.bind('support:new', refresh);
    channel.bind('support:reply', refresh);
    channel.bind('support:updated', refresh);
    return () => {
      channel.unbind('support:new', refresh);
      channel.unbind('support:reply', refresh);
      channel.unbind('support:updated', refresh);
    };
  }, [load]);

  const filtered = search
    ? tickets.filter((t) =>
        `${t.subject} ${t.ticketNumber} ${t.user?.email || ''}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    : tickets;

  const openTicket = async (ticket) => {
    setActive(ticket);
    setDetail(null);
    setReply('');
    setInternal(false);
    setDetailError('');
    setDetailLoading(true);
    try {
      const res = await api.get(`/support/tickets/${ticket.id}`);
      setDetail(unwrap(res));
    } catch (err) {
      setDetailError(err.response?.data?.message || 'Unable to load the ticket.');
    } finally {
      setDetailLoading(false);
    }
  };

  const patchTicket = async (id, payload) => {
    try {
      const res = await api.patch(`/support/tickets/${id}`, payload);
      const updated = unwrap(res);
      setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
      setActive((prev) => (prev ? { ...prev, ...updated } : prev));
      if (detail) setDetail((prev) => ({ ...prev, ...updated }));
    } catch (err) {
      setDetailError(err.response?.data?.message || 'Unable to update the ticket.');
    }
  };

  const sendReply = async (e) => {
    e.preventDefault();
    if (!active || !reply.trim()) return;
    setSending(true);
    setDetailError('');
    try {
      await api.post(`/support/tickets/${active.id}/reply`, {
        message: reply.trim(),
        isInternal: internal,
      });
      setReply('');
      setInternal(false);
      const res = await api.get(`/support/tickets/${active.id}`);
      setDetail(unwrap(res));
      load();
    } catch (err) {
      setDetailError(err.response?.data?.message || 'Unable to send the reply.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Support"
        description="Triage tickets, assign priorities, and reply to learners."
      />

      <ErrorBox message={error} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats?.total ?? '—'} icon={LifeBuoy} tone="blue" />
        <StatCard label="Open" value={stats?.open ?? '—'} icon={Clock} tone="red" />
        <StatCard label="In progress" value={stats?.inProgress ?? '—'} icon={MessageSquare} tone="amber" />
        <StatCard label="Resolved" value={stats?.resolved ?? '—'} icon={CheckCircle2} tone="green" />
      </div>

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Filter loaded tickets by subject or email…"
            />
          </div>
          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value);
            }}
            className="input-field lg:w-44"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => {
              setPage(1);
              setPriority(e.target.value);
            }}
            className="input-field lg:w-44"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading tickets…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No tickets found"
          description="Support requests from learners will appear here."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-shell min-w-[860px]">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Requester</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr key={ticket.id}>
                    <td>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {ticket.subject}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {ticket.ticketNumber} · {ticket.category || 'general'}
                      </p>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">
                      {ticket.user?.firstName} {ticket.user?.lastName}
                      <br />
                      {ticket.user?.email}
                    </td>
                    <td>
                      <span className={priorityBadge(ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td>
                      <span
                        className={
                          ticket.status === 'RESOLVED'
                            ? 'badge-success'
                            : ticket.status === 'OPEN'
                            ? 'badge-danger'
                            : ticket.status === 'CLOSED'
                            ? 'badge-neutral'
                            : 'badge-warning'
                        }
                      >
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDateTime(ticket.updatedAt)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openTicket(ticket)}
                          className="btn-secondary !px-3 !py-1.5"
                        >
                          <MessageSquare className="h-3.5 w-3.5" /> Open
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination meta={meta} onPage={setPage} />
          </div>
        </div>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? active.subject : 'Ticket'}
        description={active ? `${active.ticketNumber} · opened by ${active.user?.email || 'learner'}` : ''}
        wide
      >
        {detailError && <ErrorBox message={detailError} />}

        {active && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status" htmlFor="ticket-status">
                <select
                  id="ticket-status"
                  value={active.status}
                  onChange={(e) => patchTicket(active.id, { status: e.target.value })}
                  className="input-field"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority" htmlFor="ticket-priority">
                <select
                  id="ticket-priority"
                  value={active.priority}
                  onChange={(e) => patchTicket(active.id, { priority: e.target.value })}
                  className="input-field"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Message</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                {detail?.description || active.description}
              </p>
            </div>

            {detailLoading ? (
              <Loading label="Loading conversation…" />
            ) : (
              <div className="space-y-3">
                {(detail?.replies || []).map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl p-3 ${
                      r.isInternal
                        ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50'
                        : 'bg-slate-50 dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {r.user?.firstName} {r.user?.lastName}{' '}
                        <span className="font-normal text-slate-400">({r.user?.role})</span>
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                      {r.message}
                    </p>
                    {r.isInternal && (
                      <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        Internal note
                      </p>
                    )}
                  </div>
                ))}
                {(detail?.replies || []).length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No replies yet.</p>
                )}
              </div>
            )}

            <form onSubmit={sendReply} className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="input-field"
                placeholder="Write a reply…"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(e) => setInternal(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                  />
                  Internal note (not visible to the student)
                </label>
                <button type="submit" disabled={sending || !reply.trim()} className="btn-primary">
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSupport;
