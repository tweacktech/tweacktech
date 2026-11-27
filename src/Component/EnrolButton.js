import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../lib/apiError';

/**
 * Enrol from a catalogue card or any other listing.
 *
 * Every course, paid or free, can be joined directly — payment is an optional
 * way to support the platform and never an access gate. When a visitor is
 * signed out, the intent is saved so CourseDetail finishes the enrolment after
 * sign-in and opens the first lesson.
 */
export default function EnrolButton({ courseId, disabled = false, compact = false, onEnrolled }) {
  const { api, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleEnroll = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy || disabled) return;

    if (!isAuthenticated) {
      try {
        sessionStorage.setItem('tweack-intent-enroll', courseId);
      } catch {
        /* storage may be unavailable */
      }
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }

    setBusy(true);
    setError('');
    let joined = true;
    try {
      await api.post(`/enrollments/enroll/${courseId}`);
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to enroll right now.');
      if (/already enrolled/i.test(message)) {
        // A returning learner still ends up on their course page.
        joined = true;
      } else {
        joined = false;
        setError(message);
      }
    } finally {
      setBusy(false);
    }

    if (!joined) return;
    if (onEnrolled) onEnrolled();
    navigate(`/courses/${courseId}`);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleEnroll}
        disabled={busy || disabled}
        className={`btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-50 ${
          compact ? '!py-2.5 text-sm' : '!py-3'
        }`}
      >
        {busy ? 'Enrolling…' : isAuthenticated ? 'Enroll now' : 'Sign in to enroll'}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>
      {error && (
        <p className="mt-2 text-center text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
