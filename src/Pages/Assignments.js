import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Search,
  Send,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import QuizRunner from '../Component/QuizRunner';
import { getErrorMessage } from '../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'To do' },
  { id: 'submitted', label: 'Submitted' },
  { id: 'graded', label: 'Graded' },
];

const statusOf = (assignment) => {
  const submission = assignment.submission;
  if (!submission) return 'pending';
  if (submission.status === 'GRADED') return 'graded';
  return 'submitted';
};

const badgeFor = (assignment) => {
  const status = statusOf(assignment);
  if (status === 'graded') return <span className="badge-success">Graded</span>;
  if (status === 'submitted') {
    return assignment.submission?.status === 'LATE' ? (
      <span className="badge-danger">Submitted late</span>
    ) : (
      <span className="badge-info">Submitted</span>
    );
  }
  const due = assignment.dueAt ? new Date(assignment.dueAt) : null;
  if (due && due < new Date()) return <span className="badge-danger">Overdue</span>;
  return <span className="badge-warning">To do</span>;
};

const formatDate = (value) => {
  if (!value) return 'No due date';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'No due date';
  }
};

const Assignments = () => {
  const { api, isAuthenticated, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const courseFilter = searchParams.get('courseId') || '';
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [active, setActive] = useState(null);
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');
  const [quizFor, setQuizFor] = useState(null);

  const load = useCallback(async () => {
    if (authLoading) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/assignments/my');
      setAssignments(unwrap(res) || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your assignments.'));
    } finally {
      setLoading(false);
    }
  }, [api, authLoading, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  const available = useMemo(() => assignments.filter((a) => !a.locked), [assignments]);
  const lockedCount = assignments.length - available.length;

  const counts = useMemo(
    () => ({
      all: available.length,
      pending: available.filter((a) => statusOf(a) === 'pending').length,
      submitted: available.filter((a) => statusOf(a) === 'submitted').length,
      graded: available.filter((a) => statusOf(a) === 'graded').length,
    }),
    [available]
  );

  const visible = useMemo(
    () =>
      available.filter((assignment) => {
        if (courseFilter && assignment.course?.id !== courseFilter) return false;
        if (filter !== 'all' && statusOf(assignment) !== filter) return false;
        if (!search) return true;
        return `${assignment.title} ${assignment.course?.title || ''}`
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [available, filter, search, courseFilter]
  );

  const openSubmit = (assignment) => {
    if (assignment.type === 'QUIZ') {
      setQuizFor(assignment);
      return;
    }
    setActive(assignment);
    setContent(assignment.submission?.content || '');
    setFileUrl(assignment.submission?.fileUrl || '');
    setSubmitError('');
    setSuccess('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!active) return;
    if (!content.trim() && !fileUrl.trim()) {
      setSubmitError('Add your answer or a file link before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await api.post(`/assignments/${active.id}/submit`, {
        content: content.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
      });
      const submission = unwrap(res);
      setAssignments((prev) =>
        prev.map((a) => (a.id === active.id ? { ...a, submission } : a))
      );
      setSuccess('Assignment submitted. Your instructor will review it shortly.');
      setActive(null);
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Unable to submit the assignment.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="container-page py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-eyebrow">Coursework</span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              My assignments
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Submit your work, track deadlines, and review instructor feedback.
            </p>
          </div>
          <Link to="/courses" className="btn-secondary">
            <BookOpen className="h-4 w-4" /> Browse courses
          </Link>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {success && (
          <div className="mt-6 flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
          </div>
        )}

        {!authLoading && !isAuthenticated ? (
          <div className="card mt-8 p-10 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <ClipboardList className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
              Sign in to see your assignments
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your coursework is tied to the courses you are enrolled in.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link to="/login" className="btn-primary">Sign in</Link>
              <Link to="/register" className="btn-secondary">Create account</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATUS_FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`card p-4 text-left transition ${
                    filter === item.id
                      ? 'border-red-300 dark:border-red-800 ring-2 ring-red-500/20'
                      : 'card-hover'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                    {counts[item.id]}
                  </p>
                </button>
              ))}
            </div>

            {lockedCount > 0 && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                {lockedCount} module quiz{lockedCount === 1 ? '' : 'zes'} locked. Complete every lesson and pass the quiz in the previous module to unlock the next one.
              </div>
            )}

            <div className="card mt-6 p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Search assignments or courses…"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-20 text-sm text-slate-500 dark:text-slate-400">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                Loading assignments…
              </div>
            ) : visible.length === 0 ? (
              <div className="card mt-6 flex flex-col items-center gap-3 p-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <ClipboardList className="h-6 w-6" />
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {assignments.length === 0 ? 'No assignments yet' : 'Nothing matches this filter'}
                </h3>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {assignments.length === 0
                    ? 'Enroll in a course to receive assignments from your instructors.'
                    : 'Try a different filter or search term.'}
                </p>
                {assignments.length === 0 && (
                  <Link to="/courses" className="btn-primary mt-2">
                    <BookOpen className="h-4 w-4" /> Find a course
                  </Link>
                )}
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {visible.map((assignment) => (
                  <div key={assignment.id} className="card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {badgeFor(assignment)}
                          <span className="badge-neutral">{assignment.type}</span>
                        </div>
                        <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                          {assignment.title}
                        </h3>
                        {assignment.course && (
                          <Link
                            to={`/courses/${assignment.course.id}`}
                            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"
                          >
                            <BookOpen className="h-3.5 w-3.5" /> {assignment.course.title}
                          </Link>
                        )}
                        {assignment.description && (
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                            {assignment.description}
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {formatDate(assignment.dueAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="h-3.5 w-3.5" /> {assignment.maxScore} points
                          </span>
                        </div>

                        {assignment.submission?.status === 'GRADED' && (
                          <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-3">
                            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                              Score: {assignment.submission.score} / {assignment.maxScore}
                            </p>
                            {assignment.submission.feedback && (
                              <p className="mt-1 text-xs text-emerald-700/90 dark:text-emerald-400/90">
                                {assignment.submission.feedback}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:w-44">
                        <button
                          type="button"
                          onClick={() => openSubmit(assignment)}
                          className={
                            assignment.submission ? 'btn-secondary w-full' : 'btn-primary w-full'
                          }
                        >
                          {assignment.type === 'QUIZ' ? (
                            <>
                              <ClipboardList className="h-4 w-4" />
                              {assignment.submission ? 'Review quiz' : 'Take quiz'}
                            </>
                          ) : assignment.submission ? (
                            <>
                              <FileText className="h-4 w-4" /> View / update
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" /> Submit work
                            </>
                          )}
                        </button>
                        {assignment.submission?.fileUrl && (
                          <a
                            href={assignment.submission.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-ghost w-full !py-2 text-xs"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open attachment
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {active && (
        <div className="modal-overlay fixed inset-0 z-[80] bg-slate-950/60">
          <div className="modal-card w-full border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-xl scale-in">
            <div className="modal-header flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {active.title}
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Due {formatDate(active.dueAt)} · {active.maxScore} points
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submit} className="modal-body space-y-4 px-4 py-4 sm:px-6 sm:py-5">
              {active.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{active.description}</p>
              )}
              {active.instructions && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 text-sm text-slate-600 dark:text-slate-300">
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Instructions
                  </p>
                  <p className="whitespace-pre-line">{active.instructions}</p>
                </div>
              )}

              {submitError && (
                <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                  {submitError}
                </div>
              )}

              {active.submission && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Last submitted{' '}
                  {new Date(active.submission.submittedAt).toLocaleString()} · status{' '}
                  {active.submission.status}
                </p>
              )}

              <div>
                <label htmlFor="assignment-answer" className="label">
                  Your answer
                </label>
                <textarea
                  id="assignment-answer"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input-field"
                  placeholder="Write your answer, notes, or a link to your repository…"
                />
              </div>

              <div>
                <label htmlFor="assignment-file" className="label">
                  File or link (optional)
                </label>
                <input
                  id="assignment-file"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://drive.google.com/… or Cloudinary URL"
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Upload your file to a storage service and paste the shareable link.
                </p>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button type="button" onClick={() => setActive(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? 'Submitting…' : active.submission ? 'Update submission' : 'Submit assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {quizFor && (
        <QuizRunner
          api={api}
          assignmentId={quizFor.id}
          onClose={() => setQuizFor(null)}
          onSubmitted={load}
        />
      )}

      <Footer />
    </div>
  );
};

export default Assignments;
