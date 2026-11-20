import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../lib/apiError';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const RegisterPage = () => {
  const [form, setForm] = useState(initialForm);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />
      <div className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-12 py-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <span className="section-eyebrow">Free to join</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Start learning. <br />
            <span className="gradient-text">Get hired.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg text-slate-600 dark:text-slate-400">
            Create one account for courses, assignments, certificates, and the
            talent hub.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {[
              ['Expert-led courses', 'Frontend, backend, data, DevOps and more.'],
              ['Assignments', 'Practise with feedback from instructors.'],
              ['Certificates', 'Share verified proof of completion.'],
              ['Talent hub', 'Get discovered by hiring companies.'],
            ].map(([title, body]) => (
              <div key={title} className="card p-4">
                <CheckCircle2 className="h-5 w-5 text-red-600 dark:text-red-500" />
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {title}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="card p-8">
            <div className="mb-6 text-center">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-700 text-white shadow-lg shadow-red-600/25">
                <GraduationCap className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                Create your account
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-red-600 dark:text-red-400">
                  Sign in
                </Link>
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="label">First name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="firstName"
                      required
                      value={form.firstName}
                      onChange={update('firstName')}
                      className="input-field pl-10"
                      placeholder="Alice"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="label">Last name</label>
                  <input
                    id="lastName"
                    required
                    value={form.lastName}
                    onChange={update('lastName')}
                    className="input-field"
                    placeholder="Learner"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="label">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={update('email')}
                    className="input-field pl-10"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="label">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={form.password}
                    onChange={update('password')}
                    className="input-field pl-10 pr-10"
                    placeholder="At least 8 characters"
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

              <div>
                <label htmlFor="confirmPassword" className="label">Confirm password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  className="input-field"
                  placeholder="Repeat your password"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/terms" className="font-semibold text-red-600 dark:text-red-400">Terms of Service</Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="font-semibold text-red-600 dark:text-red-400">Privacy Policy</Link>.
                </span>
              </label>

              <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating account…
                  </>
                ) : (
                  'Create free account'
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-slate-400">
              Instructor and staff accounts are created by a platform
              administrator after review.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterPage;
