import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Award,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Download,
  GraduationCap,
  MessageCircle,
  PlayCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { downloadCertificatePdf } from '../lib/certificatePdf';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
};

const Dashboard = () => {
  const { user, api, isManagement } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'courses', label: 'My courses', icon: GraduationCap },
    { id: 'assignments', label: 'Assignments', icon: ClipboardList },
    { id: 'certificates', label: 'Certificates', icon: Award },
  ];

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const [
        enrollmentsRes,
        assignmentsRes,
        applicationsRes,
        certificatesRes,
        invitationsRes,
        attendanceRes,
      ] = await Promise.allSettled([
        api.get('/enrollments/my?limit=50'),
        api.get('/assignments/my'),
        api.get('/jobs/applications/my'),
        api.get('/certificates/my'),
        api.get('/invitations/my'),
        api.get('/attendance/my'),
      ]);

      if (cancelled) return;

      const value = (result) =>
        result.status === 'fulfilled' ? unwrap(result.value) : null;

      const enrollmentPayload = value(enrollmentsRes);
      setCourses(
        (enrollmentPayload?.enrollments || []).map((enrollment) => ({
          id: enrollment.course?.id,
          title: enrollment.course?.title || 'Course',
          thumbnail: enrollment.course?.thumbnail,
          progress: Math.round(enrollment.progress || 0),
          status: enrollment.status,
          nextLessonId: enrollment.nextLessonId || null,
          lastAccessed: enrollment.lastAccessedAt
            ? formatDate(enrollment.lastAccessedAt)
            : 'Not started',
        }))
      );
      setAssignments(value(assignmentsRes) || []);
      setApplications(value(applicationsRes) || []);
      setCertificates(value(certificatesRes) || []);
      setInvitations(value(invitationsRes) || []);
      setAttendance(value(attendanceRes) || null);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  const continueHref = (course) =>
    course.nextLessonId
      ? `/courses/${course.id}/lessons/${course.nextLessonId}`
      : `/courses/${course.id}`;

  const pendingAssignments = assignments.filter((a) => !a.submission).length;
  const gradedAssignments = assignments.filter(
    (a) => a.submission?.status === 'GRADED'
  );

  const averageProgress = courses.length
    ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length)
    : 0;

  const stats = useMemo(
    () => [
      {
        label: 'Courses enrolled',
        value: courses.length,
        icon: GraduationCap,
        tone: 'bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400',
      },
      {
        label: 'Pending assignments',
        value: pendingAssignments,
        icon: ClipboardList,
        tone: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      },
      {
        label: 'Certificates',
        value: certificates.length,
        icon: Award,
        tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      },
      {
        label: 'Job applications',
        value: applications.length,
        icon: Briefcase,
        tone: 'bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400',
      },
      {
        label: 'Attendance',
        value: `${attendance?.summary?.attendanceRate ?? 0}%`,
        icon: CheckCircle2,
        tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      },
    ],
    [courses.length, pendingAssignments, certificates.length, applications.length, attendance]
  );

  const downloadCertificate = (certificate) => {
    const learner = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
    downloadCertificatePdf({
      studentName: learner || 'Learner',
      courseTitle: certificate.course?.title || 'Course',
      certificateCode: certificate.certificateCode || certificate.id,
      issuedAt: certificate.issuedAt,
      grade: certificate.grade,
      score: certificate.score,
      verifyUrl: `${window.location.origin}/verify/${certificate.certificateCode || ''}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center gap-4 py-32">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="container-page py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="section-eyebrow">
              <Activity className="h-3.5 w-3.5" /> Dashboard
            </span>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back, {user?.firstName || 'learner'}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">
              {courses.length
                ? `You are ${averageProgress}% through your courses on average.`
                : 'Start your first course today and track progress here.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/courses" className="btn-primary">
              <BookOpen className="h-4 w-4" /> Browse courses
            </Link>
            {isManagement && (
              <Link to="/admin" className="btn-secondary">
                <Settings className="h-4 w-4" /> Admin panel
              </Link>
            )}
          </div>
        </div>

        {isManagement && (
          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200">
            <ShieldCheck className="h-5 w-5 shrink-0" />
            <p className="min-w-0 flex-1">
              <span className="font-bold">Student preview.</span> You are viewing the learner
              experience. Your own course list will be empty until you enrol — browse courses to
              try the full flow.
            </p>
            <Link to="/admin" className="btn-secondary !py-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" /> Back to admin
            </Link>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5 stagger-children">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${stat.tone}`}>
                  <stat.icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600 dark:border-red-500 dark:text-red-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
              {tab.id === 'assignments' && pendingAssignments > 0 && (
                <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingAssignments}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3 fade-in">
            <div className="min-w-0 space-y-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Continue learning
                </h2>
                {courses.length > 0 && (
                  <Link to="/courses" className="text-xs font-semibold text-red-600 dark:text-red-400">
                    View all
                  </Link>
                )}
              </div>

              {courses.length === 0 ? (
                <div className="card flex flex-col items-center gap-3 p-10 text-center">
                  <GraduationCap className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    No courses yet
                  </h3>
                  <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                    Browse the catalog and enrol in a course to start tracking progress.
                  </p>
                  <Link to="/courses" className="btn-primary mt-2">
                    Browse courses
                  </Link>
                </div>
              ) : (
                courses.slice(0, 4).map((course) => (
                  <div key={course.id} className="card p-4">
                    <div className="flex items-center gap-4">
                      <Link
                        to={`/courses/${course.id}`}
                        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800"
                        aria-label={`Open ${course.title}`}
                      >
                        {course.thumbnail ? (
                          <img loading="lazy" decoding="async" src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="grid h-full w-full place-items-center text-slate-400">
                            <BookOpen className="h-5 w-5" />
                          </span>
                        )}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/courses/${course.id}`}
                          className="block truncate font-bold text-slate-900 hover:text-red-600 dark:text-white dark:hover:text-red-400"
                        >
                          {course.title}
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Last accessed {course.lastAccessed}
                        </p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                              className="progress-bar h-2 rounded-full bg-red-600"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <Link
                        to={continueHref(course)}
                        className="btn-secondary hidden !px-3 !py-2 sm:inline-flex"
                      >
                        <PlayCircle className="h-4 w-4" /> Continue
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-4">
              <div className="card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Quick actions
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { to: '/assignments', label: 'Assignments', icon: ClipboardList },
                    { to: '/messages', label: 'Messages', icon: MessageCircle },
                    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
                    { to: '/payments', label: 'Payments', icon: CreditCard },
                    { to: '/jobs', label: 'Job board', icon: Briefcase },
                    { to: '/talent', label: 'Talent hub', icon: Users },
                  ].map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Icon className="mx-auto mb-1.5 h-5 w-5" />
                      {label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Recent grades
                </h2>
                <div className="mt-3 space-y-3">
                  {gradedAssignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {assignment.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {assignment.course?.title}
                        </p>
                      </div>
                      <span className="badge-success">
                        {assignment.submission?.score ?? 0}/{assignment.maxScore}
                      </span>
                    </div>
                  ))}
                  {gradedAssignments.length === 0 && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Graded work will appear here.
                    </p>
                  )}
                </div>
                <Link to="/assignments" className="btn-secondary mt-4 w-full !py-2">
                  Open assignments
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="mt-8 fade-in">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">My courses</h2>
            {courses.length === 0 ? (
              <div className="card mt-4 flex flex-col items-center gap-3 p-10 text-center">
                <GraduationCap className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You have not enrolled in any course yet.
                </p>
                <Link to="/courses" className="btn-primary">Browse courses</Link>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <div key={course.id} className="card overflow-hidden card-hover">
                    <Link
                      to={`/courses/${course.id}`}
                      className="block h-36 bg-slate-100 dark:bg-slate-800"
                      aria-label={`Open ${course.title}`}
                    >
                      {course.thumbnail ? (
                        <img loading="lazy" decoding="async" src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full place-items-center text-slate-400">
                          <BookOpen className="h-8 w-8" />
                        </span>
                      )}
                    </Link>
                    <div className="p-4">
                      <Link
                        to={`/courses/${course.id}`}
                        className="line-clamp-2 font-bold text-slate-900 hover:text-red-600 dark:text-white dark:hover:text-red-400"
                      >
                        {course.title}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Last accessed {course.lastAccessed}
                      </p>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>{course.status}</span>
                          <span>{course.progress}%</span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                          <div
                            className="progress-bar h-2 rounded-full bg-red-600"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <Link to={continueHref(course)} className="btn-primary mt-3 w-full !py-2">
                        Continue
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="mt-8 fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Assignments</h2>
              <Link to="/assignments" className="text-xs font-semibold text-red-600 dark:text-red-400">
                Open full page
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {assignments.slice(0, 6).map((assignment) => {
                const submission = assignment.submission;
                return (
                  <div key={assignment.id} className="card flex flex-wrap items-center gap-3 p-4">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                      <ClipboardList className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">
                        {assignment.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {assignment.course?.title} · due {formatDate(assignment.dueAt)}
                      </p>
                    </div>
                    {submission?.status === 'GRADED' ? (
                      <span className="badge-success">
                        {submission.score}/{assignment.maxScore}
                      </span>
                    ) : submission ? (
                      <span className="badge-info">Submitted</span>
                    ) : (
                      <span className="badge-warning">To do</span>
                    )}
                    <Link to="/assignments" className="btn-secondary !px-3 !py-1.5 text-xs">
                      {submission ? 'View' : 'Submit'}
                    </Link>
                  </div>
                );
              })}
              {assignments.length === 0 && (
                <div className="card flex flex-col items-center gap-3 p-10 text-center">
                  <ClipboardList className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No assignments yet. Enrol in a course to receive coursework.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'certificates' && (
          <div className="mt-8 fade-in">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Certificates</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Download and share your verified certificates.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certificates.map((certificate) => (
                <div key={certificate.id} className="card p-5 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                    <Award className="h-6 w-6" />
                  </span>
                  <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
                    {certificate.course?.title || 'Certificate'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Issued {formatDate(certificate.issuedAt)}
                  </p>
                  <p className="mt-1 text-[11px] font-mono text-slate-400">
                    {certificate.certificateCode}
                  </p>
                  <button
                    type="button"
                    onClick={() => downloadCertificate(certificate)}
                    className="btn-primary mt-4 w-full !py-2"
                  >
                    <Download className="h-4 w-4" /> Download PDF
                  </button>
                  <Link
                    to={`/verify/${certificate.certificateCode}`}
                    className="mt-2 inline-block text-xs font-semibold text-red-600 dark:text-red-400"
                  >
                    Public verification page →
                  </Link>
                </div>
              ))}
              {certificates.length === 0 && (
                <div className="card flex flex-col items-center gap-3 border-dashed p-10 text-center sm:col-span-2 lg:col-span-3">
                  <Award className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Complete a course to earn your first certificate.
                  </p>
                  <Link to="/courses" className="btn-secondary">Browse courses</Link>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'overview' && attendance?.courses?.length > 0 && (
          <div className="card mt-6 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Mentor attendance & scores
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {attendance.summary?.marked || 0} sessions recorded · average score{' '}
                {attendance.summary?.averageScore ?? '—'}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {attendance.courses.map((item) => (
                <div
                  key={item.courseId}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {item.course?.title}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${item.rate || 0}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      {item.rate || 0}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {item.present || 0} of {item.marked || 0} present · score{' '}
                    {item.averageScore ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {invitations.length > 0 && activeTab === 'overview' && (
          <div className="card mt-6 p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Course invitations
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {invitations.map((invitation) => (
                <Link
                  key={invitation.id}
                  to={
                    invitation.status === 'PENDING_PAYMENT'
                      ? '/payments'
                      : `/courses/${invitation.course?.id}`
                  }
                  className="rounded-xl border border-slate-200 p-3 hover:border-red-300 dark:border-slate-800 dark:hover:border-red-800"
                >
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {invitation.course?.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {invitation.accessType === 'FREE' ? 'Free access' : 'Paid invitation'} ·{' '}
                    {invitation.invitedBy?.firstName} {invitation.invitedBy?.lastName}
                  </p>
                  <span
                    className={
                      invitation.status === 'ACCEPTED'
                        ? 'badge-success mt-2'
                        : invitation.status === 'PENDING_PAYMENT'
                        ? 'badge-warning mt-2'
                        : 'badge-danger mt-2'
                    }
                  >
                    {invitation.status === 'PENDING_PAYMENT' ? 'Payment needed' : invitation.status}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {applications.length > 0 && activeTab === 'overview' && (
          <div className="card mt-6 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Job applications
              </h2>
              <Link to="/jobs" className="text-xs font-semibold text-red-600 dark:text-red-400">
                Find more roles
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {applications.slice(0, 3).map((application) => (
                <Link
                  key={application.id}
                  to={`/jobs/${application.job?.id}`}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 hover:border-red-300 dark:hover:border-red-700"
                >
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {application.job?.title || 'Role'}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {application.job?.company}
                  </p>
                  <span className="badge-info mt-2">{application.status}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
