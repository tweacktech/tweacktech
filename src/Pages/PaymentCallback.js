import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const PaymentCallback = () => {
  const { api } = useAuth();
  const [params] = useSearchParams();
  const reference = params.get('reference') || params.get('trxref');
  const [state, setState] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!reference) {
      setState('error');
      setMessage('No payment reference was provided.');
      return undefined;
    }

    api
      .post('/payments/paystack/verify', { reference })
      .then((res) => {
        if (cancelled) return;
        const payment = unwrap(res);
        setState('success');
        setMessage(`Payment confirmed for ${payment?.course?.title || 'your course'}.`);
      })
      .catch((error) => {
        if (cancelled) return;
        setState('error');
        setMessage(
          error?.response?.data?.message ||
            'We could not confirm this payment yet. If you were charged, it will be reviewed by an admin.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, [api, reference]);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page flex min-h-[65vh] items-center justify-center py-10">
        <div className="card w-full max-w-md p-8 text-center">
          {state === 'verifying' && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-red-600" />
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Confirming your payment…
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Please keep this page open for a moment.
              </p>
            </>
          )}
          {state === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Payment confirmed
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
              <div className="mt-5 flex justify-center gap-2">
                <Link to="/dashboard" className="btn-primary">Go to dashboard</Link>
                <Link to="/payments" className="btn-secondary">View payments</Link>
              </div>
            </>
          )}
          {state === 'error' && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-red-600" />
              <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                Payment not confirmed
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
              <div className="mt-5 flex justify-center gap-2">
                <Link to="/payments" className="btn-primary">Open payments</Link>
                <Link to="/support" className="btn-secondary">Contact support</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentCallback;
