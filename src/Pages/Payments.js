import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  CreditCard,
  FileUp,
  Landmark,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import Breadcrumbs from '../Component/Breadcrumbs';
import { useAuth } from '../AuthContext';
import { useCurrency } from '../CurrencyContext';
import { getErrorMessage } from '../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const STATUS = {
  PENDING: { label: 'Awaiting receipt', className: 'badge-warning', hint: 'Transfer the amount, then upload your receipt.' },
  AWAITING_APPROVAL: { label: 'Under review', className: 'badge-info', hint: 'An admin is verifying your payment.' },
  COMPLETED: { label: 'Paid', className: 'badge-success', hint: 'Your course access is active.' },
  FAILED: { label: 'Failed', className: 'badge-danger', hint: 'The payment did not go through.' },
  REJECTED: { label: 'Needs attention', className: 'badge-danger', hint: 'Re-upload a clearer receipt or contact support.' },
  REFUNDED: { label: 'Refunded', className: 'badge-neutral', hint: 'This payment was refunded.' },
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

const Payments = () => {
  const { api } = useAuth();
  const { formatIn } = useCurrency();
  const [payments, setPayments] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [active, setActive] = useState(null);
  const [file, setFile] = useState(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [paymentsRes, bankRes] = await Promise.all([
        api.get('/payments/my?limit=50'),
        api.get('/payments/bank-accounts').catch(() => null),
      ]);
      setPayments(unwrap(paymentsRes)?.payments || []);
      if (bankRes) setBankAccounts(unwrap(bankRes) || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your payments.'));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const openUpload = (payment) => {
    setActive(payment);
    setFile(null);
    setNote(payment.adminNote || '');
    setError('');
  };

  const submitProof = async (event) => {
    event.preventDefault();
    if (!file) {
      setError('Choose a receipt image or PDF first.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', file);
      if (note.trim()) form.append('note', note.trim());
      await api.post(`/payments/${active.id}/proof`, form);
      setActive(null);
      setSuccess('Receipt uploaded. An admin will verify it shortly.');
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not upload the receipt.'));
    } finally {
      setUploading(false);
    }
  };

  const pending = payments.filter((payment) =>
    ['PENDING', 'AWAITING_APPROVAL', 'REJECTED'].includes(payment.status),
  );

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Payments' }]} className="mb-5" />


        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-eyebrow">
              <CreditCard className="h-3.5 w-3.5" /> Payments
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Payments & receipts
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Track course payments, upload bank-transfer proofs, and confirm access.
            </p>
          </div>
          <Link to="/courses" className="btn-secondary">
            <BookOpen className="h-4 w-4" /> Browse courses
          </Link>
        </div>

        {error && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <section className="card overflow-hidden lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white">Your payments</h2>
              <button type="button" onClick={load} className="btn-ghost !px-2 !py-1.5" aria-label="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading payments…
              </div>
            ) : payments.length === 0 ? (
              <div className="p-10 text-center">
                <Landmark className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">No payments yet</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Choose a paid course and pick bank transfer or card.
                </p>
                <Link to="/courses" className="btn-primary mt-4">
                  Find a course
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {payments.map((payment) => {
                  const meta = STATUS[payment.status] || STATUS.PENDING;
                  return (
                    <div key={payment.id} className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={payment.course?.id ? `/courses/${payment.course.id}` : '/courses'}
                            className="font-semibold text-slate-900 hover:text-red-600 dark:text-white"
                          >
                            {payment.course?.title || 'Course payment'}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                            {payment.reference || payment.transactionId} · {formatDate(payment.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {formatIn(payment.amount, payment.currency)}
                          </p>
                          <span className={`${meta.className} mt-1`}>{meta.label}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                        <span className="badge-neutral">
                          {String(payment.paymentMethod || 'BANK_TRANSFER').replace('_', ' ')}
                        </span>
                        {payment.currency !== payment.baseCurrency && payment.baseAmount && (
                          <span className="text-slate-400">
                            Base {formatIn(payment.baseAmount, payment.baseCurrency)}
                          </span>
                        )}
                        {payment.proofUrl && (
                          <a
                            href={payment.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold text-red-600 dark:text-red-400"
                          >
                            View receipt
                          </a>
                        )}
                      </div>

                      {payment.adminNote && (
                        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                          <strong>Reviewer note:</strong> {payment.adminNote}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400">
                          {meta.hint}
                        </p>
                        {['PENDING', 'REJECTED'].includes(payment.status) && (
                          <button
                            type="button"
                            onClick={() => openUpload(payment)}
                            className="btn-primary !px-3 !py-1.5 text-xs"
                          >
                            <FileUp className="h-3.5 w-3.5" />
                            {payment.status === 'REJECTED' ? 'Re-upload proof' : 'Upload proof'}
                          </button>
                        )}
                        {payment.status === 'AWAITING_APPROVAL' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 dark:text-sky-400">
                            <Clock className="h-3.5 w-3.5" /> Awaiting admin approval
                          </span>
                        )}
                        {payment.status === 'COMPLETED' && payment.course?.id && (
                          <Link
                            to={`/courses/${payment.course.id}`}
                            className="btn-secondary !px-3 !py-1.5 text-xs"
                          >
                            Open course <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="font-bold text-slate-900 dark:text-white">How bank transfer works</h2>
              <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {[
                  'Choose a course and select “Bank transfer”.',
                  'Transfer the exact amount to one of the accounts.',
                  'Use the payment reference as the narration.',
                  'Upload your receipt here.',
                  'An admin verifies it and unlocks the course.',
                ].map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 dark:bg-red-950/60 dark:text-red-400">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bank accounts
              </h2>
              <div className="mt-3 space-y-2">
                {bankAccounts.length === 0 ? (
                  <p className="text-sm text-slate-400">
                    Bank details appear when you start a bank-transfer payment.
                  </p>
                ) : (
                  bankAccounts.map((account) => (
                    <div key={account.id} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">{account.bankName}</p>
                      <p className="font-mono text-sm text-slate-700 dark:text-slate-300">{account.accountNumber}</p>
                      <p className="text-slate-500 dark:text-slate-400">
                        {account.accountName} · {account.currency}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {pending.length > 0 && (
                <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                  {pending.length} payment{pending.length > 1 ? 's' : ''} need attention.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {active && (
        <div className="modal-overlay fixed inset-0 z-[90] bg-slate-950/60">
          <div className="modal-card w-full max-w-md border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="modal-header flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">Upload payment proof</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {active.course?.title} · {formatIn(active.amount, active.currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitProof} className="modal-body space-y-4 px-4 py-4 sm:px-6 sm:py-5">
              {active.reference && (
                <div className="rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60">
                  <p className="text-slate-500 dark:text-slate-400">Use this reference in your transfer:</p>
                  <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {active.reference}
                  </p>
                </div>
              )}
              <div>
                <label htmlFor="receipt" className="label">
                  Receipt (JPG, PNG or PDF, max 4MB)
                </label>
                <input
                  ref={fileRef}
                  id="receipt"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                />
                {file && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{file.name}</p>}
              </div>

              <div>
                <label htmlFor="proof-note" className="label">
                  Note (optional)
                </label>
                <textarea
                  id="proof-note"
                  rows={2}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="input-field"
                  placeholder="Sender name, bank, or anything the reviewer should know"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setActive(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={uploading || !file} className="btn-primary">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                  {uploading ? 'Uploading…' : 'Submit proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Payments;
