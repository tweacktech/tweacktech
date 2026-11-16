import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  CreditCard,
  GraduationCap,
  LifeBuoy,
  Newspaper,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { Loading, PageHeader, StatCard, formatDate, formatDateTime, formatMoney } from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const relativeTime = (value) => {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(value);
};

const ACTION_ICON = (action = '') => {
  if (action.startsWith('auth')) return UserCheck;
  if (action.startsWith('attendance')) return CheckCircle2;
  if (action.startsWith('payments')) return CreditCard;
  if (action.startsWith('courses') || action.startsWith('lessons')) return BookOpen;
  if (action.startsWith('assignments') || action.startsWith('submissions')) return ClipboardList;
  if (action.startsWith('users')) return Users;
  if (action.startsWith('mentors')) return BadgeCheck;
  if (action.startsWith('support')) return LifeBuoy;
  return Activity;
};

const AdminDashboard = () => {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [staffData, setStaffData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const request = isAdmin ? api.get('/users/dashboard/admin') : api.get('/users/dashboard/me');
    request
      .then((res) => {
        if (cancelled) return;
        if (isAdmin) setOverview(unwrap(res) || null);
        else setStaffData(unwrap(res) || null);
      })
      .catch(() => {
        if (!cancelled) {
          if (isAdmin) setOverview(null);
          else setStaffData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, isAdmin]);

  if (loading) return <Loading label="Loading your dashboard…" />;

  if (!isAdmin) {
    const stats = staffData?.stats || {};
    const courses = staffData?.courses || [];
    const submissions = staffData?.recentSubmissions || [];
    return (
      <div className="space-y-8 fade-in">
        <PageHeader
          title={`Welcome back, ${user?.firstName || 'there'}`}
          description="Your teaching cockpit: courses, learners and work waiting for feedback."
          actions={
            <>
              <Link to="/admin/courses" className="btn-primary">
                <BookOpen className="h-4 w-4" /> My courses
              </Link>
              <Link to="/admin/assignments" className="btn-secondary">
                <ClipboardList className="h-4 w-4" /> Assignments
              </Link>
            </>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Courses" value={stats.courses ?? 0} icon={BookOpen} tone="red" hint="Assigned to you" />
          <StatCard label="Learners" value={stats.students ?? 0} icon={Users} tone="blue" hint="Across your courses" />
          <StatCard label="Modules" value={stats.modules ?? 0} icon={ClipboardList} tone="violet" hint="Lessons organised" />
          <StatCard
            label="Awaiting grading"
            value={stats.pendingSubmissions ?? 0}
            icon={Award}
            tone="amber"
            hint="Submissions to review"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Your courses
              </h2>
              <Link to="/admin/courses" className="text-xs font-semibold text-red-600 dark:text-red-400">
                Manage
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {courses.slice(0, 5).map((course) => (
                <Link
                  key={course.id}
                  to={`/admin/courses/${course.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {course.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {course._count?.enrollments || 0} learners · {course._count?.modules || 0} modules
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </Link>
              ))}
              {courses.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No courses assigned to you yet.
                </p>
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Latest submissions
              </h2>
              <Link to="/admin/assignments" className="text-xs font-semibold text-red-600 dark:text-red-400">
                Review
              </Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {submissions.map((submission) => (
                <div key={submission.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <ClipboardList className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {submission.assignment?.title}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {submission.user?.firstName} {submission.user?.lastName} ·{' '}
                      {relativeTime(submission.submittedAt)}
                    </p>
                  </div>
                  <span className="badge-warning">{submission.status}</span>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No submissions yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = overview?.stats || {};
  const attendance = overview?.attendanceToday || {};
  const trend = overview?.trend || [];
  const maxTrend = Math.max(1, ...trend.map((item) => item.count));
  const revenue = overview?.revenue || [];

  return (
    <div className="space-y-8 fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-900 px-6 py-7 text-white sm:px-8">
        <div className="absolute inset-0">
          <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-red-600/30 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-52 w-52 rounded-full bg-rose-500/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-red-300">
              <Clock className="mr-1 inline h-3 w-3" />
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome back, {user?.firstName || 'Admin'}
            </h1>
            <p className="mt-1 max-w-xl text-sm text-slate-300">
              Everything happening across TweackTech right now — learners, revenue, attendance
              and the latest admin activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/courses" className="btn-primary">
              <BookOpen className="h-4 w-4" /> Manage courses
            </Link>
            <Link
              to="/admin/payments"
              className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
            >
              <CreditCard className="h-4 w-4" /> Payments
              {stats.awaitingPayments ? (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold">
                  {stats.awaitingPayments}
                </span>
              ) : null}
            </Link>
            <Link
              to="/admin/activity"
              className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
            >
              <Activity className="h-4 w-4" /> Activity log
            </Link>
            <Link
              to="/student-dashboard"
              className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
            >
              <GraduationCap className="h-4 w-4" /> Student view
            </Link>
          </div>
        </div>
      </section>

      {/* Primary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total users" value={stats.users ?? 0} icon={Users} tone="blue" hint={`${stats.students ?? 0} students · ${stats.staff ?? 0} staff`} />
        <StatCard label="Enrolments" value={stats.enrollments ?? 0} icon={GraduationCap} tone="green" hint={`${stats.certificates ?? 0} certificates issued`} />
        <StatCard label="Courses" value={stats.courses ?? 0} icon={BookOpen} tone="red" hint={`${stats.publishedCourses ?? 0} published`} />
        <StatCard label="Mentors" value={stats.mentors ?? 0} icon={BadgeCheck} tone="violet" hint="Public mentor profiles" />
      </div>

      {/* Operational stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Awaiting grading" value={stats.pendingSubmissions ?? 0} icon={ClipboardList} tone="amber" hint="Submitted assignments" />
        <StatCard label="Payments to approve" value={stats.awaitingPayments ?? 0} icon={Wallet} tone="red" hint="Awaiting verification" />
        <StatCard label="Open tickets" value={stats.openTickets ?? 0} icon={LifeBuoy} tone="blue" hint="Support queue" />
        <StatCard label="Upcoming sessions" value={stats.upcomingSessions ?? 0} icon={CalendarDays} tone="green" hint="Live classes scheduled" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Enrolment trend */}
        <div className="card p-5 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <TrendingUp className="h-4 w-4 text-red-600" /> New enrolments
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Last six months across every course
              </p>
            </div>
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {trend.reduce((sum, item) => sum + item.count, 0)} total
            </span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-3">
            {trend.map((item) => (
              <div key={item.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {item.count}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-red-700 to-red-400 transition-all"
                    style={{ height: `${Math.max(6, (item.count / maxTrend) * 100)}%` }}
                    title={`${item.label}: ${item.count}`}
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Attendance */}
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Attendance today
          </h2>
          <div className="mt-4 flex items-center gap-4">
            <div
              className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full"
              style={{
                background: `conic-gradient(#059669 ${attendance.rate || 0}%, #e2e8f0 ${
                  attendance.rate || 0
                }% 100%)`,
              }}
            >
              <span className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-lg font-extrabold text-slate-900 dark:bg-slate-900 dark:text-white">
                {attendance.rate || 0}%
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                {attendance.present || 0} present
              </p>
              <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                {attendance.absent || 0} absent
              </p>
              <p className="text-xs text-slate-400">{attendance.marked || 0} marked today</p>
            </div>
          </div>
          <Link
            to="/admin/attendance"
            className="btn-secondary mt-5 w-full !py-2 text-xs"
          >
            Take attendance <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Recent activity + revenue */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Activity className="h-4 w-4 text-red-600" /> Recent activity
            </h2>
            <Link to="/admin/activity" className="text-xs font-semibold text-red-600 dark:text-red-400">
              Full log
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(overview?.recentLogs || []).map((log) => {
              const Icon = ACTION_ICON(log.action);
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {log.description || log.action}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {log.actorName || 'System'} · {relativeTime(log.createdAt)}
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:inline">
                    {log.action}
                  </span>
                </div>
              );
            })}
            {!(overview?.recentLogs || []).length && (
              <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                Activity will appear here as your team works.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Wallet className="h-4 w-4 text-emerald-500" /> Revenue collected
            </h2>
            <div className="mt-3 space-y-2">
              {revenue.map((row) => (
                <div
                  key={row.currency}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60"
                >
                  <span className="font-medium text-slate-600 dark:text-slate-300">
                    {row.currency}
                  </span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {formatMoney(row.amount, row.currency)}
                  </span>
                </div>
              ))}
              {revenue.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  No completed payments yet.
                </p>
              )}
            </div>
            <Link to="/admin/payments" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400">
              Review payments <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Award className="h-4 w-4 text-amber-500" /> Top courses
            </h2>
            <div className="mt-3 space-y-3">
              {(overview?.topCourses || []).map((course, index) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="flex items-center gap-3"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-red-50 text-xs font-extrabold text-red-600 dark:bg-red-950/50 dark:text-red-400">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {course.title}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {course._count?.enrollments || 0} learners
                    </p>
                  </div>
                </Link>
              ))}
              {!(overview?.topCourses || []).length && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No published courses yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming + newest users */}
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <CalendarDays className="h-4 w-4 text-red-600" /> Upcoming live sessions
            </h2>
            <Link to="/calendar" className="text-xs font-semibold text-red-600 dark:text-red-400">
              Calendar
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(overview?.upcoming || []).map((session) => (
              <div key={session.id} className="flex items-center gap-3 px-5 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {session.title}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {session.course?.title} · {formatDateTime(session.startTime)}
                  </p>
                </div>
              </div>
            ))}
            {!(overview?.upcoming || []).length && (
              <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No live sessions scheduled.
              </p>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Users className="h-4 w-4 text-red-600" /> Newest users
            </h2>
            <Link to="/admin/users" className="text-xs font-semibold text-red-600 dark:text-red-400">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {(overview?.recentUsers || []).map((person) => (
              <div key={person.id} className="flex items-center gap-3 px-5 py-3">
                {person.avatar ? (
                  <img src={person.avatar} alt="" className="h-9 w-9 rounded-lg object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {`${person.firstName?.[0] || ''}${person.lastName?.[0] || ''}`}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {person.firstName} {person.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{person.email}</p>
                </div>
                <span className="badge-neutral">{person.role}</span>
              </div>
            ))}
            {!(overview?.recentUsers || []).length && (
              <p className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                No users yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/admin/users', label: 'Users & roles', Icon: Users, tone: 'text-sky-600' },
          { to: '/admin/assignments', label: 'Assignments', Icon: ClipboardList, tone: 'text-amber-600' },
          { to: '/admin/talent', label: 'Talent Hub', Icon: Briefcase, tone: 'text-violet-600' },
          { to: '/admin/blog', label: 'Blog', Icon: Newspaper, tone: 'text-rose-600' },
        ].map(({ to, label, Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <span className={`grid h-10 w-10 place-items-center rounded-xl bg-slate-100 dark:bg-slate-800 ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{label}</span>
            <ArrowRight className="ml-auto h-4 w-4 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
