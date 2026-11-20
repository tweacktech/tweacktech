import React, { useCallback, useEffect, useState } from 'react';
import {
  Briefcase,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { getPusher } from '../../lib/pusher';
import {
  EmptyState,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeader,
  Pagination,
  Toggle,
  formatDate,
  formatMoney,
} from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'];
const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead'];
const APPLICATION_STATUSES = ['PENDING', 'REVIEWED', 'SHORTLISTED', 'REJECTED', 'HIRED'];

const emptyForm = {
  title: '',
  company: '',
  companyLogo: '',
  companyWebsite: '',
  location: 'Remote',
  isRemote: true,
  type: 'FULL_TIME',
  level: 'Mid',
  salaryMin: '',
  salaryMax: '',
  currency: 'USD',
  description: '',
  requirements: '',
  responsibilities: '',
  benefits: '',
  tags: '',
  deadline: '',
  isPublished: false,
  isFeatured: false,
};

const statusBadge = (status) => {
  if (status === 'HIRED') return 'badge-success';
  if (status === 'REJECTED') return 'badge-danger';
  if (status === 'SHORTLISTED') return 'badge-info';
  if (status === 'REVIEWED') return 'badge-warning';
  return 'badge-neutral';
};

const AdminJobs = () => {
  const { api } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [applicationsFor, setApplicationsFor] = useState(null);
  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appError, setAppError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '9' });
      if (search) params.set('search', search);
      const res = await api.get(`/jobs/admin/all?${params.toString()}`);
      const data = unwrap(res);
      setJobs(data?.jobs || []);
      setMeta(data?.meta || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [api, page, search]);

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
      if (data?.job?.title) {
        window.dispatchEvent(
          new CustomEvent('tweack:notification', {
            detail: {
              id: `application-${Date.now()}`,
              title: 'New job application',
              body: `${data.user?.firstName || 'A candidate'} applied for ${data.job.title}.`,
              link: '/admin/jobs',
            },
          }),
        );
      }
    };
    channel.bind('application:new', refresh);
    channel.bind('application:updated', refresh);
    return () => {
      channel.unbind('application:new', refresh);
      channel.unbind('application:updated', refresh);
    };
  }, [load]);

  const update = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (job) => {
    setEditingId(job.id);
    setForm({
      title: job.title || '',
      company: job.company || '',
      companyLogo: job.companyLogo || '',
      companyWebsite: job.companyWebsite || '',
      location: job.location || 'Remote',
      isRemote: !!job.isRemote,
      type: job.type || 'FULL_TIME',
      level: job.level || 'Mid',
      salaryMin: job.salaryMin ?? '',
      salaryMax: job.salaryMax ?? '',
      currency: job.currency || 'USD',
      description: job.description || '',
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      benefits: job.benefits || '',
      tags: job.tags || '',
      deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '',
      isPublished: !!job.isPublished,
      isFeatured: !!job.isFeatured,
    });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await api.put(`/jobs/${editingId}`, form);
      else await api.post('/jobs', form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the job.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (job) => {
    if (!window.confirm(`Delete “${job.title}” at ${job.company}?`)) return;
    try {
      await api.delete(`/jobs/${job.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete the job.');
    }
  };

  const togglePublish = async (job) => {
    try {
      await api.put(`/jobs/${job.id}`, { isPublished: !job.isPublished });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, isPublished: !j.isPublished } : j))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update the job.');
    }
  };

  const openApplications = async (job) => {
    setApplicationsFor(job);
    setApplications([]);
    setAppError('');
    setAppsLoading(true);
    try {
      const res = await api.get(`/jobs/${job.id}/applications`);
      setApplications(unwrap(res) || []);
    } catch (err) {
      setAppError(err.response?.data?.message || 'Unable to load applications.');
    } finally {
      setAppsLoading(false);
    }
  };

  const changeApplicationStatus = async (applicationId, status) => {
    try {
      await api.patch(`/jobs/applications/${applicationId}`, { status });
      setApplications((prev) =>
        prev.map((a) => (a.id === applicationId ? { ...a, status } : a))
      );
    } catch (err) {
      setAppError(err.response?.data?.message || 'Unable to update the application.');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Jobs"
        description="Manage the talent-hub job board. Grant MANAGE_JOBS to let admins post roles."
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New job
          </button>
        }
      />

      <ErrorBox message={error} />

      <div className="card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="input-field pl-10"
            placeholder="Search by title, company, or location…"
          />
        </div>
      </div>

      {loading ? (
        <Loading label="Loading jobs…" />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs yet"
          description="Post your first role to open the talent board to candidates."
          action={
            <button type="button" onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> New job
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <div key={job.id} className="card flex flex-col p-5 card-hover">
              <div className="flex items-start gap-3">
                {job.companyLogo ? (
                  <img
                    src={job.companyLogo}
                    alt=""
                    className="h-11 w-11 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                    <Briefcase className="h-5 w-5" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 font-bold text-slate-900 dark:text-white">
                    {job.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{job.company}</p>
                </div>
                {job.isFeatured && (
                  <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className={job.isPublished ? 'badge-success' : 'badge-warning'}>
                  {job.isPublished ? 'Published' : 'Draft'}
                </span>
                <span className="badge-neutral">{job.type.replace('_', ' ')}</span>
                {job.isRemote && <span className="badge-info">Remote</span>}
              </div>

              <div className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                <p className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {job.location}
                </p>
                <p>
                  {formatMoney(job.salaryMin, job.currency)} –{' '}
                  {formatMoney(job.salaryMax, job.currency)}
                </p>
                <p>Posted {formatDate(job.createdAt)}</p>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => openApplications(job)}
                  className="btn-secondary flex-1 !py-2"
                >
                  <Users className="h-3.5 w-3.5" />
                  {job._count?.applications ?? 0}
                </button>
                <button
                  type="button"
                  onClick={() => togglePublish(job)}
                  className="btn-secondary !px-3 !py-2"
                  title={job.isPublished ? 'Unpublish' : 'Publish'}
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(job)}
                  className="btn-secondary !px-3 !py-2"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(job)}
                  className="btn-ghost !px-3 !py-2 text-red-600 dark:text-red-400"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit job' : 'Create job'}
        description="Published jobs appear on the public job board immediately."
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job title" htmlFor="job-title">
              <input id="job-title" required value={form.title} onChange={update('title')} className="input-field" />
            </Field>
            <Field label="Company" htmlFor="job-company">
              <input id="job-company" required value={form.company} onChange={update('company')} className="input-field" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company logo URL" htmlFor="job-logo">
              <input id="job-logo" value={form.companyLogo} onChange={update('companyLogo')} className="input-field" placeholder="https://…" />
            </Field>
            <Field label="Company website" htmlFor="job-website">
              <input id="job-website" value={form.companyWebsite} onChange={update('companyWebsite')} className="input-field" placeholder="https://…" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Location" htmlFor="job-location">
              <input id="job-location" value={form.location} onChange={update('location')} className="input-field" />
            </Field>
            <Field label="Type" htmlFor="job-type">
              <select id="job-type" value={form.type} onChange={update('type')} className="input-field">
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Level" htmlFor="job-level">
              <select id="job-level" value={form.level} onChange={update('level')} className="input-field">
                {LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Salary min" htmlFor="job-smin">
              <input id="job-smin" type="number" min="0" value={form.salaryMin} onChange={update('salaryMin')} className="input-field" />
            </Field>
            <Field label="Salary max" htmlFor="job-smax">
              <input id="job-smax" type="number" min="0" value={form.salaryMax} onChange={update('salaryMax')} className="input-field" />
            </Field>
            <Field label="Currency" htmlFor="job-currency">
              <input id="job-currency" value={form.currency} onChange={update('currency')} className="input-field" />
            </Field>
            <Field label="Deadline" htmlFor="job-deadline">
              <input id="job-deadline" type="date" value={form.deadline} onChange={update('deadline')} className="input-field" />
            </Field>
          </div>

          <Field label="Description" htmlFor="job-description">
            <textarea id="job-description" required rows={5} value={form.description} onChange={update('description')} className="input-field" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Requirements" htmlFor="job-requirements" hint="One per line">
              <textarea id="job-requirements" rows={4} value={form.requirements} onChange={update('requirements')} className="input-field" />
            </Field>
            <Field label="Responsibilities" htmlFor="job-resp" hint="One per line">
              <textarea id="job-resp" rows={4} value={form.responsibilities} onChange={update('responsibilities')} className="input-field" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Benefits" htmlFor="job-benefits" hint="One per line">
              <textarea id="job-benefits" rows={3} value={form.benefits} onChange={update('benefits')} className="input-field" />
            </Field>
            <Field label="Tags" htmlFor="job-tags" hint="Comma separated">
              <input id="job-tags" value={form.tags} onChange={update('tags')} className="input-field" />
            </Field>
          </div>

          <div className="flex flex-wrap gap-6 pt-1">
            <Toggle label="Remote" checked={form.isRemote} onChange={(v) => setForm((p) => ({ ...p, isRemote: v }))} />
            <Toggle label="Published" checked={form.isPublished} onChange={(v) => setForm((p) => ({ ...p, isPublished: v }))} />
            <Toggle label="Featured" checked={form.isFeatured} onChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create job'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!applicationsFor}
        onClose={() => setApplicationsFor(null)}
        title={applicationsFor ? `Applications · ${applicationsFor.title}` : 'Applications'}
        description="Review candidates and move them through the hiring pipeline."
        wide
      >
        {appError && <ErrorBox message={appError} />}
        {appsLoading ? (
          <Loading label="Loading applications…" />
        ) : applications.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No applications yet.
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {app.user?.firstName} {app.user?.lastName}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {app.user?.email}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Applied {formatDate(app.createdAt)}
                    </p>
                  </div>
                  <select
                    value={app.status}
                    onChange={(e) => changeApplicationStatus(app.id, e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {app.coverLetter && (
                  <p className="mt-3 whitespace-pre-line rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-600 dark:text-slate-300">
                    {app.coverLetter}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                  {app.resumeUrl && (
                    <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-red-600 dark:text-red-400">
                      Résumé
                    </a>
                  )}
                  {app.portfolioUrl && (
                    <a href={app.portfolioUrl} target="_blank" rel="noreferrer" className="text-red-600 dark:text-red-400">
                      Portfolio
                    </a>
                  )}
                  {app.user?.github && (
                    <a href={app.user.github} target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400">
                      GitHub
                    </a>
                  )}
                  {app.user?.linkedin && (
                    <a href={app.user.linkedin} target="_blank" rel="noreferrer" className="text-slate-500 dark:text-slate-400">
                      LinkedIn
                    </a>
                  )}
                  <span className={statusBadge(app.status)}>{app.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminJobs;
