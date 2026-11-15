import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Layers,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

const StaffDashboard = () => {
  const { api, user } = useAuth();
  const [data, setData] = useState({ courses: [], recentStudents: [], recentSubmissions: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/users/dashboard/me');
      const payload = unwrap(res) || {};
      setData({
        courses: payload.courses || [],
        recentStudents: payload.recentStudents || [],
        recentSubmissions: payload.recentSubmissions || [],
        stats: payload.stats || {},
      });
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your teaching dashboard.'));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = [
    { label: 'Assigned courses', value: data.stats.courses ?? data.courses.length, icon: BookOpen },
    { label: 'Students on your courses', value: data.stats.students ?? 0, icon: Users },
    { label: 'Modules', value: data.stats.modules ?? 0, icon: Layers },
    { label: 'Submissions to grade', value: data.stats.pendingSubmissions ?? 0, icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="section-eyebrow">
              <GraduationCap className="h-3.5 w-3.5" /> Teaching
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome, {user?.firstName || 'instructor'}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Only the courses assigned to you are shown here.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/courses" className="btn-secondary">
              <BookOpen className="h-4 w-4" /> My courses
            </Link>
            <Link to="/admin/assignments" className="btn-secondary">
              <Award className="h-4 w-4" /> Grading
            </Link>
            <button type="button" onClick={load} className="btn-primary">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your courses</h2>
              <Link to="/admin/courses" className="text-xs font-semibold text-red-600 dark:text-red-400">
                Open course manager
              </Link>
            </div>

            {loading ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[0, 1].map((item) => (
                  <div key={item} className="card h-36 animate-pulse" />
                ))}
              </div>
            ) : data.courses.length === 0 ? (
              <div className="card mt-4 p-10 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 font-semibold text-slate-900 dark:text-white">
                  No courses assigned yet
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  A superadmin or admin can assign you as lead or co-instructor.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/admin/courses/${course.id}`}
                    className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="badge-neutral">{course.type}</span>
                      <span className={course.isPublished ? 'badge-success' : 'badge-warning'}>
                        {course.isPublished ? 'Live' : 'Draft'}
                      </span>
                    </div>
                    <h3 className="mt-2 line-clamp-2 font-bold text-slate-900 dark:text-white">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {course.category?.name || 'Uncategorised'} · {course.duration}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {course._count?.enrollments ?? 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3.5 w-3.5" /> {course._count?.modules ?? 0} modules
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent submissions</h2>
              <div className="card mt-3 divide-y divide-slate-100 dark:divide-slate-800">
                {data.recentSubmissions.length === 0 ? (
                  <p className="p-5 text-sm text-slate-500 dark:text-slate-400">
                    No submissions yet.
                  </p>
                ) : (
                  data.recentSubmissions.map((submission) => (
                    <div key={submission.id} className="flex flex-wrap items-center gap-3 p-4">
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {`${submission.user?.firstName?.[0] || ''}${submission.user?.lastName?.[0] || ''}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {submission.assignment?.title}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {submission.user?.firstName} {submission.user?.lastName} ·{' '}
                          {submission.assignment?.course?.title} · {formatDate(submission.submittedAt)}
                        </p>
                      </div>
                      <span
                        className={
                          submission.status === 'GRADED' ? 'badge-success' : 'badge-warning'
                        }
                      >
                        {submission.status}
                      </span>
                      <Link to="/admin/assignments" className="text-xs font-semibold text-red-600 dark:text-red-400">
                        Grade
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Recent students
              </h2>
              <div className="mt-3 space-y-2">
                {data.recentStudents.length === 0 ? (
                  <p className="text-sm text-slate-400">No students enrolled yet.</p>
                ) : (
                  data.recentStudents.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {`${enrollment.user?.firstName?.[0] || ''}${enrollment.user?.lastName?.[0] || ''}`}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {enrollment.user?.firstName} {enrollment.user?.lastName}
                        </p>
                        <p className="truncate text-[11px] text-slate-400">
                          {enrollment.course?.title}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Settings className="h-4 w-4 text-red-600" /> Quick actions
              </h2>
              <div className="mt-3 grid gap-2">
                <Link to="/admin/courses" className="btn-secondary !py-2 text-xs">
                  Manage my courses
                </Link>
                <Link to="/admin/assignments" className="btn-secondary !py-2 text-xs">
                  Create / grade assignments
                </Link>
                <Link to="/calendar" className="btn-secondary !py-2 text-xs">
                  My live sessions
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StaffDashboard;
