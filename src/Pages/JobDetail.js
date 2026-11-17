import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Globe,
  MapPin,
  Send,
  Users,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import ShareButtons from '../Component/ShareButtons';
import { useAuth } from '../AuthContext';
import { useSeo } from '../Component/useSeo';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const formatDate = (value) => {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return null;
  }
};

const salaryRange = (job) => {
  if (!job?.salaryMin && !job?.salaryMax) return 'Competitive';
  const currency = job.currency || 'USD';
  const fmt = (n) =>
    new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(Number(n));
  if (job.salaryMin && job.salaryMax) return `${fmt(job.salaryMin)} – ${fmt(job.salaryMax)}`;
  return fmt(job.salaryMin || job.salaryMax);
};

const listLines = (value) =>
  (value || '')
    .split('\n')
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);

const JobDetail = () => {
  const { jobId } = useParams();
  const { api, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    coverLetter: '',
    resumeUrl: '',
    portfolioUrl: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  useSeo({
    title: job ? `${job.title} at ${job.company}` : 'Developer Jobs',
    description:
      job?.description?.replace(/<[^>]+>/g, '').slice(0, 180) ||
      `${job?.company || ''} is hiring on TweackTech. Explore developer roles and apply.`,
    image: job?.companyLogo || '/icon-512.png',
    url: `/jobs/${jobId}`,
    author: `${job?.company || 'TweackTech'} · Meyor Dari`,
    section: 'Developer jobs',
    keywords: `${job?.title || ''}, ${job?.company || ''} jobs, developer jobs, TweackTech talent hub, Meyor Dari`,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/jobs/${jobId}`);
        if (!cancelled) setJob(unwrap(res));
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? 'This job is no longer available.'
              : err.response?.data?.message || 'Unable to load this job.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api, jobId]);

  // Reset per-role state whenever the user opens a different job. Without this,
  // a previous “Application sent” card leaks into the next job page.
  useEffect(() => {
    setApplied(false);
    setSuccess('');
    setShowForm(false);
  }, [jobId]);

  // Check whether this candidate already applied to *this* job.
  useEffect(() => {
    if (!isAuthenticated) {
      setApplied(false);
      return undefined;
    }
    let cancelled = false;
    api
      .get('/jobs/applications/my')
      .then((res) => {
        if (cancelled) return;
        const payload = unwrap(res);
        const apps = Array.isArray(payload) ? payload : payload?.applications || [];
        setApplied(apps.some((application) => application.job?.id === jobId));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, isAuthenticated, jobId]);

  const submitApplication = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        coverLetter: form.coverLetter.trim() || undefined,
        resumeUrl: form.resumeUrl.trim() || undefined,
        portfolioUrl: form.portfolioUrl.trim() || undefined,
      });
      setApplied(true);
      setShowForm(false);
      setSuccess('Application sent. The hiring team will review your profile.');
    } catch (err) {
      setFormError(
        err.response?.data?.message || 'Unable to send your application. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${jobId}` } });
      return;
    }
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="container-page py-8">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all jobs
        </Link>

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="card p-6 lg:col-span-2">
              <div className="skeleton h-8 w-2/3" />
              <div className="skeleton mt-4 h-4 w-1/3" />
              <div className="skeleton mt-8 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-full" />
              <div className="skeleton mt-2 h-4 w-3/4" />
            </div>
            <div className="card h-48 p-6">
              <div className="skeleton h-5 w-1/2" />
              <div className="skeleton mt-3 h-4 w-2/3" />
            </div>
          </div>
        ) : error || !job ? (
          <div className="card mt-8 flex flex-col items-center gap-3 p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
              <Briefcase className="h-6 w-6" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Job not found
            </h1>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              {error || 'The role you are looking for may have been closed.'}
            </p>
            <Link to="/jobs" className="btn-primary mt-2">
              Browse open roles
            </Link>
          </div>
        ) : (
          <>
            <ShareButtons
              className="mt-4"
              url={`/jobs/${jobId}`}
              title={`${job.title} at ${job.company}`}
              description={`${job.location} · ${job.type?.replace('_', ' ')}`}
            />
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="card p-6">
                  <div className="flex items-start gap-4">
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt=""
                        className="h-16 w-16 rounded-2xl object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                        <Building2 className="h-7 w-7" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                          {job.title}
                        </h1>
                        {job.isFeatured && <span className="badge-warning">Featured</span>}
                      </div>
                      <p className="mt-1 text-slate-600 dark:text-slate-400">{job.company}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" /> {job.type.replace('_', ' ')}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" /> {salaryRange(job)}
                        </span>
                        {job.level && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" /> {job.level}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {job.tags && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.tags.split(',').filter(Boolean).map((tag) => (
                        <span
                          key={tag}
                          className="badge bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="card p-6">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    About the role
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {job.description}
                  </p>
                </div>

                {listLines(job.responsibilities).length > 0 && (
                  <div className="card p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Responsibilities
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {listLines(job.responsibilities).map((line) => (
                        <li key={line} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {listLines(job.requirements).length > 0 && (
                  <div className="card p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Requirements
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {listLines(job.requirements).map((line) => (
                        <li key={line} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {listLines(job.benefits).length > 0 && (
                  <div className="card p-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Benefits</h2>
                    <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                      {listLines(job.benefits).map((line) => (
                        <li key={line} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <aside className="space-y-5">
                <div className="card p-6">
                  {success && (
                    <div className="mb-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
                      {success}
                    </div>
                  )}

                  {applied ? (
                    <div className="text-center">
                      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-6 w-6" />
                      </span>
                      <h2 className="mt-3 font-bold text-slate-900 dark:text-white">
                        Application sent
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        You can track its status in your dashboard.
                      </p>
                      <Link to="/dashboard" className="btn-secondary mt-4 w-full">
                        View applications
                      </Link>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-bold text-slate-900 dark:text-white">
                        Interested in this role?
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {isAuthenticated
                          ? 'Send your profile to the hiring team.'
                          : 'Sign in to apply with your TweackTech profile.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleApplyClick}
                        className="btn-primary mt-4 w-full"
                      >
                        <Send className="h-4 w-4" />
                        {isAuthenticated ? 'Apply now' : 'Sign in to apply'}
                      </button>
                      {isAuthenticated && (
                        <p className="mt-2 text-center text-[11px] text-slate-400">
                          Applying as {user?.firstName} {user?.lastName}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="card space-y-3 p-6 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Job type</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {job.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Location</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {job.location}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-500 dark:text-slate-400">Salary</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {salaryRange(job)}
                    </span>
                  </div>
                  {job.deadline && (
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                        <CalendarDays className="h-3.5 w-3.5" /> Deadline
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatDate(job.deadline)}
                      </span>
                    </div>
                  )}
                  {job.companyWebsite && (
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 pt-2 text-xs font-semibold text-red-600 dark:text-red-400"
                    >
                      <Globe className="h-3.5 w-3.5" /> Visit company website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-slate-900 p-6">
                  <h3 className="font-bold text-slate-900 dark:text-white">Not the right fit?</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    Explore more roles or build the skills employers are asking for.
                  </p>
                  <Link to="/courses" className="btn-secondary mt-3 w-full">
                    Browse courses
                  </Link>
                </div>
              </aside>
            </div>

            {showForm && (
              <div className="modal-overlay fixed inset-0 z-[80] bg-slate-950/60">
                <div className="modal-card w-full max-w-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 scale-in">
                  <div className="modal-header flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Apply to {job.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {job.company} · {job.location}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      aria-label="Close application form"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={submitApplication} className="modal-body space-y-4 px-4 py-4 sm:px-6 sm:py-5">
                    {formError && (
                      <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                        {formError}
                      </div>
                    )}

                    <div>
                      <label htmlFor="cover-letter" className="label">
                        Cover letter
                      </label>
                      <textarea
                        id="cover-letter"
                        rows={5}
                        value={form.coverLetter}
                        onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))}
                        className="input-field"
                        placeholder="Tell the hiring team why you are a great fit…"
                      />
                    </div>

                    <div>
                      <label htmlFor="resume-url" className="label">
                        Résumé link
                      </label>
                      <input
                        id="resume-url"
                        value={form.resumeUrl}
                        onChange={(e) => setForm((p) => ({ ...p, resumeUrl: e.target.value }))}
                        className="input-field"
                        placeholder="https://drive.google.com/…"
                      />
                    </div>

                    <div>
                      <label htmlFor="portfolio-url" className="label">
                        Portfolio / GitHub
                      </label>
                      <input
                        id="portfolio-url"
                        value={form.portfolioUrl}
                        onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                        className="input-field"
                        placeholder="https://github.com/you"
                      />
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                      <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" disabled={submitting} className="btn-primary">
                        {submitting ? 'Sending…' : 'Send application'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default JobDetail;
