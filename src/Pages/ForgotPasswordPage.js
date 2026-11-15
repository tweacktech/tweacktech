import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { AuthLayout, AuthInput, Alert, SubmitButton, getApiError } from '../Component/AuthLayout';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setMessage(res?.message || 'If an account exists for that email, a reset link has been sent.');
    } catch (err) {
      setError(getApiError(err, 'Could not send the reset link. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link"
      footer={
        <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400 hover:text-red-500">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
      }
    >
      {message ? (
        <div className="space-y-5">
          <Alert type="success">{message}</Alert>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            The link expires in 1 hour. Check your spam folder if you don't see it.
          </p>
          <button
            type="button"
            onClick={() => { setMessage(''); setEmail(''); }}
            className="text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <Alert>{error}</Alert>}
          <AuthInput
            id="email"
            label="Email address"
            type="email"
            autoComplete="email"
            required
            icon={Mail}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <SubmitButton loading={loading} loadingText="Sending link...">
            Send reset link
          </SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
