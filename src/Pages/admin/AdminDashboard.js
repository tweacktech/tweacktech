import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  LifeBuoy,
  Newspaper,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { Loading, PageHeader, StatCard, formatDate } from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const AdminDashboard = () => {
  const { api, user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);

  const can = (permission) => hasPermission(permission);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      const requests = [];
      const keys = [];

      if (can('MANAGE_USERS')) {
        keys.push('users', 'students');
        requests.push(
          api.get('/users?limit=5'),
          api.get('/users?role=STUDENT&limit=1')
        );
      }
      if (can('MANAGE_COURSES')) {
        keys.push('courses');
        requests.push(api.get('/courses/admin/all?limit=1'));
      }
      if (can('MANAGE_JOBS')) {
        keys.push('jobs');
        requests.push(api.get('/jobs/admin/all?limit=5'));
      }
      if (can('MANAGE_BLOG')) {
        keys.push('blog');
        requests.push(api.get('/blog/admin/all?limit=1'));
      }
      if (can('MANAGE_SUPPORT')) {
        keys.push('tickets');
        requests.push(api.get('/support/tickets?limit=5'));
      }

      const results = await Promise.allSettled(requests);
      if (cancelled) return;

      const byKey = {};
      results.forEach((result, index) => {
        byKey[keys[index]] = result.status === 'fulfilled' ? unwrap(result.value) : null;
      });

      setStats({
        users: byKey.users?.meta?.total,
        students: byKey.students?.meta?.total,
        courses: byKey.courses?.meta?.total,
        jobs: byKey.jobs?.meta?.total,
        posts: byKey.blog?.meta?.total,
        tickets: byKey.tickets?.meta?.total,
      });
      setRecentUsers(byKey.users?.users || []);
      setRecentTickets(byKey.tickets?.tickets || []);
      setRecentJobs(byKey.jobs?.jobs || []);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading label="Loading overview…" />;

  const statCards = [
    can('MANAGE_USERS') && {
      key: 'users',
      label: 'Total users',
      value: stats.users,
      icon: Users,
      tone: 'blue',
      hint: 'All roles',
    },
    can('MANAGE_USERS') && {
      key: 'students',
      label: 'Students',
      value: stats.students,
      icon: Award,
      tone: 'green',
      hint: 'Active learners',
    },
    can('MANAGE_COURSES') && {
      key: 'courses',
      label: 'Courses',
      value: stats.courses,
      icon: BookOpen,
      tone: 'red',
      hint: 'Published and drafts',
    },
    can('MANAGE_JOBS') && {
      key: 'jobs',
      label: 'Job posts',
      value: stats.jobs,
      icon: Briefcase,
      tone: 'violet',
      hint: 'All listings',
    },
    can('MANAGE_BLOG') && {
      key: 'posts',
      label: 'Blog posts',
      value: stats.posts,
      icon: Newspaper,
      tone: 'amber',
      hint: 'Articles and news',
    },
    can('MANAGE_SUPPORT') && {
      key: 'tickets',
      label: 'Support tickets',
      value: stats.tickets,
      icon: LifeBuoy,
      tone: 'red',
      hint: 'Open and resolved',
    },
  ].filter(Boolean);

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Admin'}`}
        description="A live snapshot of the platform: people, content, and support."
        actions={
          <>
            {can('MANAGE_COURSES') && (
              <Link to="/admin/courses" className="btn-primary">
                <BookOpen className="h-4 w-4" /> Manage courses
              </Link>
            )}
            {can('MANAGE_JOBS') && (
              <Link to="/admin/jobs" className="btn-secondary">
                <Briefcase className="h-4 w-4" /> Manage jobs
              </Link>
            )}
          </>
        }
      />

      {statCards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statCards.map(({ key, label, value, icon, tone, hint }) => (
            <StatCard
              key={key}
              label={label}
              value={value ?? '—'}
              icon={icon}
              tone={tone}
              hint={hint}
            />
          ))}
        </div>
      ) : (
        <div className="card p-6 text-sm text-slate-500 dark:text-slate-400">
          You do not have access to any management sections yet. Ask a superadmin to grant you a
          capability such as MANAGE_COURSES.
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        {can('MANAGE_USERS') && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Newest users
              </h2>
              <Link to="/admin/users" className="text-xs font-semibold text-red-600 dark:text-red-400">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {`${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                  </div>
                  <span className="badge-neutral">{u.role}</span>
                </div>
              ))}
              {recentUsers.length === 0 && (
                <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">No users yet.</p>
              )}
            </div>
          </div>
        )}

        {can('MANAGE_SUPPORT') && (
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Latest support tickets
              </h2>
              <Link to="/admin/support" className="text-xs font-semibold text-red-600 dark:text-red-400">
                View all
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentTickets.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                    <LifeBuoy className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {t.subject}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t.ticketNumber} · {formatDate(t.createdAt)}
                    </p>
                  </div>
                  <span
                    className={
                      t.status === 'RESOLVED'
                        ? 'badge-success'
                        : t.status === 'OPEN'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }
                  >
                    {t.status}
                  </span>
                </div>
              ))}
              {recentTickets.length === 0 && (
                <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">No tickets yet.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {can('MANAGE_JOBS') && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Recent job listings
            </h2>
            <Link to="/admin/jobs" className="text-xs font-semibold text-red-600 dark:text-red-400">
              Manage jobs
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
                  <Briefcase className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {job.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {job.company} · {job.location}
                  </p>
                </div>
                <span className={job.isPublished ? 'badge-success' : 'badge-warning'}>
                  {job.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
            {recentJobs.length === 0 && (
              <p className="px-5 py-6 text-sm text-slate-500 dark:text-slate-400">No jobs yet.</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-6 dark:border-red-900/50 dark:from-red-950/30 dark:to-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-white">
              <TrendingUp className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Grow your catalog</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Publish a new course or job post in under a minute from the panels above.
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Platform healthy
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
