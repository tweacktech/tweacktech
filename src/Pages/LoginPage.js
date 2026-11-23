import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, Lock, Mail } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../lib/apiError';
import GoogleSignIn from '../Component/GoogleSignIn';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin, sessionNotice, clearSessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password, remember);
      const destination = location.state?.from || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to sign in. Check your email and password.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (idToken) => {
    setGoogleError('');
    setLoading(true);
    try {
      const account = await googleLogin(idToken);
      const destination = location.state?.from || (account.role === 'STUDENT' ? '/dashboard' : '/admin');
      navigate(destination, { replace: true });
    } catch (err) {
      setGoogleError(getErrorMessage(err, 'Google sign-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const accounts = {
      superadmin: 'meyorpop@gmail.com',
      student: 'student@tweacktech.com',
      staff: 'staff@tweacktech.com',
    };
    setEmail(accounts[role]);
    setPassword('password@123');
  };

  // This project's ESLint setup does not count JSX-only uses of local helpers.
  void fillDemo;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      <div className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-12 py-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <span className="section-eyebrow">Welcome back</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Pick up where you <span className="gradient-text">left off.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-600 dark:text-slate-400">
            Your courses, assignments, certificates, and job applications are
            waiting in one dashboard.
          </p>
          <div className="mt-10 space-y-4">
            {[
              'Track progress across every course',
              'Submit assignments and get feedback',
              'Download verified certificates',
              'Apply to vetted tech roles',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-red-100 dark:bg-red-950/60 text-xs font-bold text-red-600 dark:text-red-400">
                  ✓
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="card p-8">
            <div className="mb-7 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-600/25">
                <GraduationCap className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                Sign in to TweackTech
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                New here?{' '}
                <Link to="/register" className="font-semibold text-red-600 dark:text-red-400">
                  Create a free account
                </Link>
              </p>
            </div>

            {sessionNotice && (
              <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                <span className="mt-0.5">⚠</span>
                <span className="flex-1">{sessionNotice}</span>
                <button
                  type="button"
                  onClick={clearSessionNotice}
                  className="text-xs font-bold underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="label">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="mb-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600"
                />
                Remember me on this device
              </label>

              <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {googleError && (
              <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {googleError}
              </p>
            )}

            <GoogleSignIn onSuccess={handleGoogle} />

            {/* <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5">
              <p className="mb-2 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                Demo accounts
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['superadmin', 'Super admin'],
                  ['staff', 'Staff'],
                  ['student', 'Student'],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => fillDemo(key)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-400">
                Password for demo accounts: password@123
              </p>
            </div> */}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LoginPage;
