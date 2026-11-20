import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Banknote,
  Check,
  Clock,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { useCurrency } from '../../CurrencyContext';
import {
  EmptyState,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeader,
  Pagination,
  StatCard,
  Toggle,
  formatDateTime,
} from '../../Component/admin/AdminUI';
import { getErrorMessage } from '../../lib/apiError';
import { getPusher } from '../../lib/pusher';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'AWAITING_APPROVAL', label: 'Awaiting approval' },
  { value: 'PENDING', label: 'Awaiting receipt' },
  { value: 'COMPLETED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'FAILED', label: 'Failed' },
];

const statusBadge = (status) => {
  if (status === 'COMPLETED') return 'badge-success';
  if (status === 'AWAITING_APPROVAL') return 'badge-info';
  if (status === 'REJECTED' || status === 'FAILED') return 'badge-danger';
  return 'badge-warning';
};

const emptyAccount = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  currency: 'NGN',
  branch: '',
  instructions: '',
  isActive: true,
};

const AdminPayments = () => {
  const { api } = useAuth();
  const { formatIn } = useCurrency();
  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState(null);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('AWAITING_APPROVAL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [note, setNote] = useState('');
  const [acting, setActing] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [accountModal, setAccountModal] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccount);
  const [accountSaving, setAccountSaving] = useState(false);
  const [tab, setTab] = useState('payments');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (status) params.set('status', status);
      if (search) params.set('search', search);
      const [listRes, statsRes] = await Promise.all([
        api.get(`/payments?${params.toString()}`),
        api.get('/payments/revenue/stats'),
      ]);
      const data = unwrap(listRes);
      setPayments(data?.payments || []);
      setMeta(data?.meta || null);
      setStats(unwrap(statsRes));
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load payments.'));
    } finally {
      setLoading(false);
    }
  }, [api, page, search, status]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const pusher = getPusher();
    if (!pusher) return undefined;
    const channel = pusher.subscribe('private-admin');
    const refresh = (data) => {
      load();
      if (data?.studentName) {
        window.dispatchEvent(
          new CustomEvent('tweack:notification', {
            detail: {
              id: `payment-${Date.now()}`,
              title: 'New payment proof',
              body: `${data.studentName} submitted proof for ${data.courseTitle || 'a course'}.`,
              link: '/admin/payments',
            },
          }),
        );
      }
      window.dispatchEvent(new Event('tweack:payment-activity'));
    };
    channel.bind('payment:submitted', refresh);
    channel.bind('payment:created', refresh);
    channel.bind('payment:reviewed', refresh);
    return () => {
      channel.unbind('payment:submitted', refresh);
      channel.unbind('payment:created', refresh);
      channel.unbind('payment:reviewed', refresh);
    };
  }, [load]);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await api.get('/payments/bank-accounts');
      setAccounts(unwrap(res) || []);
    } catch {
      setAccounts([]);
    }
  }, [api]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const review = async (action) => {
    if (!active) return;
    setActing(true);
    setError('');
    try {
      await api.patch(`/payments/${active.id}/review`, {
        action,
        note: note.trim() || undefined,
      });
      setActive(null);
      setNote('');
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to review this payment.'));
    } finally {
      setActing(false);
    }
  };

  const openAccount = (account = null) => {
    setAccountModal(account || 'new');
    setAccountForm(account ? { ...emptyAccount, ...account } : { ...emptyAccount });
  };

  const saveAccount = async (event) => {
    event.preventDefault();
    setAccountSaving(true);
    try {
      if (accountModal === 'new') await api.post('/payments/bank-accounts', accountForm);
      else await api.patch(`/payments/bank-accounts/${accountModal.id}`, accountForm);
      setAccountModal(null);
      loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save the bank account.'));
    } finally {
      setAccountSaving(false);
    }
  };

  const deleteAccount = async (account) => {
    if (!window.confirm(`Remove ${account.bankName} · ${account.accountNumber}?`)) return;
    try {
      await api.delete(`/payments/bank-accounts/${account.id}`);
      loadAccounts();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to remove the bank account.'));
    }
  };

  const awaiting = useMemo(
    () => payments.filter((payment) => payment.status === 'AWAITING_APPROVAL').length,
    [payments],
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Payments"
        description="Verify bank transfers, approve access and manage the accounts students pay into."
        actions={
          <>
            <button type="button" onClick={load} className="btn-secondary">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <button type="button" onClick={() => openAccount()} className="btn-primary">
              <Plus className="h-4 w-4" /> Bank account
            </button>
          </>
        }
      />

      <ErrorBox message={error} />

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Revenue (base USD)"
            value={formatIn(stats.totalRevenueUsd || 0, 'USD')}
            hint={`${stats.totalTransactions || 0} completed`}
            icon={Banknote}
            tone="green"
          />
          <StatCard
            label="Awaiting approval"
            value={stats.awaitingApproval ?? 0}
            hint="Proofs to verify"
            icon={Clock}
            tone="amber"
          />
          <StatCard
            label="Awaiting receipt"
            value={stats.pending ?? 0}
            hint="Started, no proof yet"
            icon={CreditCard}
            tone="blue"
          />
          <StatCard
            label="On this page"
            value={awaiting}
            hint="Needs review"
            icon={BadgeCheck}
            tone="red"
          />
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'payments', label: 'Payments', icon: CreditCard },
          { id: 'accounts', label: 'Bank accounts', icon: Landmark },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
              tab === item.id
                ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}
      </div>

      {tab === 'payments' ? (
        <>
          <div className="card p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => {
                    setPage(1);
                    setSearch(event.target.value);
                  }}
                  className="input-field pl-10"
                  placeholder="Search reference, email or student…"
                />
              </div>
              <select
                value={status}
                onChange={(event) => {
                  setPage(1);
                  setStatus(event.target.value);
                }}
                className="input-field lg:w-56"
              >
                {STATUS_FILTERS.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <Loading label="Loading payments…" />
          ) : payments.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="No payments here"
              description="When students submit bank-transfer proofs they will appear in this queue."
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-shell min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {payment.user?.firstName} {payment.user?.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{payment.user?.email}</p>
                        </td>
                        <td className="max-w-[220px]">
                          <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                            {payment.course?.title || '—'}
                          </p>
                          <p className="font-mono text-[11px] text-slate-400">
                            {payment.reference || payment.transactionId}
                          </p>
                        </td>
                        <td className="text-sm font-semibold">
                          {formatIn(payment.amount, payment.currency)}
                        </td>
                        <td>
                          <span className="badge-neutral">
                            {String(payment.paymentMethod || 'BANK').replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={statusBadge(payment.status)}>{payment.status}</span>
                        </td>
                        <td className="text-xs text-slate-500">
                          {formatDateTime(payment.proofUploadedAt || payment.createdAt)}
                        </td>
                        <td>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setActive(payment);
                                setNote(payment.adminNote || '');
                              }}
                              className="btn-secondary !px-3 !py-1.5 text-xs"
                            >
                              Review
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
        </>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{account.bankName}</p>
                  <p className="font-mono text-lg text-slate-700 dark:text-slate-300">
                    {account.accountNumber}
                  </p>
                  <p className="text-xs text-slate-500">{account.accountName}</p>
                </div>
                <span className={account.isActive ? 'badge-success' : 'badge-danger'}>
                  {account.isActive ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {account.currency} {account.branch ? `· ${account.branch}` : ''}
              </p>
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={() => openAccount(account)} className="btn-secondary flex-1 !py-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteAccount(account)}
                  className="btn-ghost !px-3 !py-2 text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {accounts.length === 0 && (
            <EmptyState
              icon={Landmark}
              title="No bank accounts"
              description="Add at least one account so students can pay by transfer."
              action={
                <button type="button" onClick={() => openAccount()} className="btn-primary">
                  <Plus className="h-4 w-4" /> Add account
                </button>
              }
            />
          )}
        </div>
      )}

      <Modal
        open={!!active}
        onClose={() => setActive(null)}
        title={active ? `Review payment · ${active.reference || active.id.slice(0, 8)}` : 'Review payment'}
        description="Check the proof against the amount and reference before approving."
        wide
      >
        {active && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Student</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {active.user?.firstName} {active.user?.lastName}
                </p>
                <p className="text-xs text-slate-500">{active.user?.email}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Course</p>
                <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                  {active.course?.title || '—'}
                </p>
                <p className="text-xs text-slate-500">{active.course?.type}</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Amount</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-white">
                  {formatIn(active.amount, active.currency)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Method</p>
                <p className="mt-1 font-bold text-slate-900 dark:text-white">
                  {String(active.paymentMethod || 'BANK_TRANSFER').replace('_', ' ')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <p className="text-[11px] uppercase tracking-wider text-slate-400">Status</p>
                <p className="mt-1">
                  <span className={statusBadge(active.status)}>{active.status}</span>
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Proof</p>
              {active.proofUrl ? (
                <div className="mt-2 space-y-2">
                  {/\.(png|jpe?g|webp|gif)(\?|$)/i.test(active.proofUrl) ? (
                    <a href={active.proofUrl} target="_blank" rel="noreferrer">
                      <img
                        src={active.proofUrl}
                        alt="Payment proof"
                        className="max-h-72 w-full rounded-lg border border-slate-200 object-contain dark:border-slate-700"
                      />
                    </a>
                  ) : (
                    <a
                      href={active.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary !py-2 text-xs"
                    >
                      Open submitted proof
                    </a>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Uploaded {formatDateTime(active.proofUploadedAt)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No proof uploaded yet.</p>
              )}
            </div>

            {active.adminNote && (
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <strong>Previous note:</strong> {active.adminNote}
              </div>
            )}

            <Field label="Reviewer note (sent to the student on rejection)" htmlFor="payment-note">
              <textarea
                id="payment-note"
                rows={3}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="input-field"
                placeholder="e.g. The amount received was lower than the course price."
              />
            </Field>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" onClick={() => setActive(null)} className="btn-secondary">
                Close
              </button>
              {active.status !== 'COMPLETED' && (
                <>
                  <button
                    type="button"
                    onClick={() => review('reject')}
                    disabled={acting}
                    className="btn-ghost text-red-600"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => review('approve')}
                    disabled={acting}
                    className="btn-primary"
                  >
                    {acting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Approve & unlock
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!accountModal}
        onClose={() => setAccountModal(null)}
        title={accountModal === 'new' ? 'Add bank account' : 'Edit bank account'}
        description="These details appear to students who choose bank transfer."
      >
        <form onSubmit={saveAccount} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Bank name" htmlFor="bank-name">
              <input
                id="bank-name"
                required
                value={accountForm.bankName}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, bankName: event.target.value }))}
                className="input-field"
              />
            </Field>
            <Field label="Account name" htmlFor="account-name">
              <input
                id="account-name"
                required
                value={accountForm.accountName}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, accountName: event.target.value }))}
                className="input-field"
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account number" htmlFor="account-number">
              <input
                id="account-number"
                required
                value={accountForm.accountNumber}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, accountNumber: event.target.value }))}
                className="input-field font-mono"
              />
            </Field>
            <Field label="Currency" htmlFor="account-currency">
              <select
                id="account-currency"
                value={accountForm.currency}
                onChange={(event) => setAccountForm((prev) => ({ ...prev, currency: event.target.value }))}
                className="input-field"
              >
                <option value="NGN">NGN — Naira</option>
                <option value="GHS">GHS — Cedi</option>
                <option value="USD">USD — Dollar</option>
                <option value="GBP">GBP — Pound</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </Field>
          </div>
          <Field label="Branch" htmlFor="account-branch">
            <input
              id="account-branch"
              value={accountForm.branch}
              onChange={(event) => setAccountForm((prev) => ({ ...prev, branch: event.target.value }))}
              className="input-field"
            />
          </Field>
          <Field label="Instructions" htmlFor="account-instructions">
            <textarea
              id="account-instructions"
              rows={2}
              value={accountForm.instructions}
              onChange={(event) => setAccountForm((prev) => ({ ...prev, instructions: event.target.value }))}
              className="input-field"
            />
          </Field>
          <Toggle
            label="Active"
            checked={!!accountForm.isActive}
            onChange={(value) => setAccountForm((prev) => ({ ...prev, isActive: value }))}
          />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setAccountModal(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={accountSaving} className="btn-primary">
              {accountSaving ? 'Saving…' : 'Save account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminPayments;
