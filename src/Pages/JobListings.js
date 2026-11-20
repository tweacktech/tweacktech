import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Clock,
  DollarSign,
  Filter,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';

const JOB_TYPES = [
  { id: '', label: 'All types' },
  { id: 'FULL_TIME', label: 'Full-time' },
  { id: 'PART_TIME', label: 'Part-time' },
  { id: 'CONTRACT', label: 'Contract' },
  { id: 'INTERNSHIP', label: 'Internship' },
  { id: 'FREELANCE', label: 'Freelance' },
];

const typeLabel = (type = '') => type.replace('_', ' ').toLowerCase();

const timeAgo = (value) => {
  if (!value) return 'Recently';
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
};

const salaryRange = (job) => {
  if (!job.salaryMin && !job.salaryMax) return 'Competitive';
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

const JobListings = () => {
  const { api } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [remoteOnly, setRemoteOnly] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);
      if (type) params.set('type', type);
      if (remoteOnly) params.set('isRemote', 'true');
      const res = await api.get(`/jobs?${params.toString()}`);
      const payload = res?.data?.data !== undefined ? res.data.data : res.data;
      setJobs(payload?.jobs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load jobs right now.');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [api, search, type, remoteOnly]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const featured = useMemo(() => jobs.filter((job) => job.isFeatured), [jobs]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <header className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-page py-12">
          <div className="max-w-2xl">
            <span className="section-eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> Talent hub
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
              Find your next <span className="gradient-text">developer role</span>
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Browse curated roles from companies hiring developers, designers, and
              data specialists.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
                placeholder="Search by title, company, tag, or location…"
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="input-field sm:w-44"
                aria-label="Filter by job type"
              >
                {JOB_TYPES.map((option) => (
                  <option key={option.id || 'all'} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500"
                />
                Remote only
              </label>
            </div>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {featured.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Featured roles
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {featured.slice(0, 2).map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="card card-hover flex items-start gap-4 p-5"
                >
                  {job.companyLogo ? (
                    <img
                      src={job.companyLogo}
                      alt=""
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                      <Briefcase className="h-5 w-5" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" /> {salaryRange(job)}
                      </span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {loading ? 'Loading roles…' : `${jobs.length} open role${jobs.length === 1 ? '' : 's'}`}
              </h2>
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Filter className="h-3.5 w-3.5" /> Updated live
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="card p-5">
                    <div className="skeleton h-5 w-1/2" />
                    <div className="skeleton mt-3 h-4 w-1/3" />
                    <div className="skeleton mt-4 h-3 w-2/3" />
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 p-12 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                  <Briefcase className="h-6 w-6" />
                </span>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  No roles found
                </h3>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  Try a broader search or remove the filters. New roles are posted regularly.
                </p>
              </div>
            ) : (
              jobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="card card-hover block p-5"
                >
                  <div className="flex items-start gap-4">
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <Briefcase className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">{job.title}</h3>
                        {job.isFeatured && <span className="badge-warning">Featured</span>}
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {typeLabel(job.type)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" /> {salaryRange(job)}
                        </span>
                      </div>

                      {job.tags && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {job.tags.split(',').filter(Boolean).slice(0, 5).map((tag) => (
                            <span
                              key={tag}
                              className="badge bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                            >
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      )}

                      <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                        {job.description}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>Posted {timeAgo(job.publishedAt || job.createdAt)}</span>
                        <span>{job._count?.applications ?? 0} applicants</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <aside className="space-y-5">
            <div className="card p-6">
              <h2 className="font-bold text-slate-900 dark:text-white">Hiring developers?</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Reach vetted programmers from the TweackTech talent hub and post your role
                to thousands of learners.
              </p>
              <Link to="/talent" className="btn-primary mt-4 w-full">
                Explore talent
              </Link>
              <Link to="/contact" className="btn-secondary mt-2 w-full">
                Talk to us
              </Link>
            </div>

            <div className="card p-6">
              <h2 className="font-bold text-slate-900 dark:text-white">Prepare for the role</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li>• Build job-ready projects with expert-led courses.</li>
                <li>• Earn certificates you can share with employers.</li>
                <li>• Practise with assignments and get feedback.</li>
              </ul>
              <Link to="/courses" className="btn-secondary mt-4 w-full">
                Browse courses
              </Link>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JobListings;
