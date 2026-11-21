import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  GraduationCap,
  Layers,
  Lock,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import {
  EmptyState,
  ErrorBox,
  Field,
  Loading,
  Modal,
  PageHeader,
  Toggle,
  formatDateTime,
} from '../../Component/admin/AdminUI';
import { getErrorMessage } from '../../lib/apiError';
import HtmlEditor from '../../Component/admin/HtmlEditor';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const emptyModule = {
  title: '',
  description: '',
  order: '',
  isPublished: true,
  unlockAfterDays: '',
  unlockAt: '',
};

const emptyLesson = {
  title: '',
  description: '',
  readingContent: '',
  type: 'VIDEO',
  contentUrl: '',
  duration: '',
  order: '',
  isFree: false,
  isPublished: true,
  unlockAfterDays: '',
  unlockAt: '',
};

const emptySession = {
  title: '',
  description: '',
  meetingUrl: '',
  startTime: '',
  endTime: '',
  timezone: 'Africa/Lagos',
  reminderMinutesBefore: 30,
};

const toLocalInput = (value) =>
  value ? new Date(value).toISOString().slice(0, 16) : '';

const AdminCourseBuilder = () => {
  const { id } = useParams();
  const { api } = useAuth();
  const [course, setCourse] = useState(null);
  const [instructors, setInstructors] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModules, setOpenModules] = useState({});

  const [leadId, setLeadId] = useState('');
  const [coIds, setCoIds] = useState([]);
  const [savingInstructors, setSavingInstructors] = useState(false);

  const [moduleModal, setModuleModal] = useState(null);
  const [moduleForm, setModuleForm] = useState(emptyModule);
  const [lessonModal, setLessonModal] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState(emptySession);
  const [saving, setSaving] = useState(false);

  const [invitations, setInvitations] = useState([]);
  const [enrolled, setEnrolled] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteSearch, setInviteSearch] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [accessType, setAccessType] = useState('FREE');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseRes, sessionRes, inviteRes, enrollmentRes] = await Promise.all([
        api.get(`/courses/admin/${id}`),
        api.get(`/courses/${id}/sessions`).catch(() => null),
        api.get(`/courses/${id}/invitations`).catch(() => null),
        api.get(`/enrollments/course/${id}`).catch(() => null),
      ]);
      const data = unwrap(courseRes);
      setCourse(data);
      setLeadId(data.instructorId || '');
      setCoIds((data.instructors || []).map((row) => row.userId));
      if (sessionRes) setSessions(unwrap(sessionRes) || []);
      if (inviteRes) setInvitations(unwrap(inviteRes) || []);
      if (enrollmentRes) setEnrolled(unwrap(enrollmentRes) || []);
      const open = {};
      (data.modules || []).forEach((module) => {
        open[module.id] = true;
      });
      setOpenModules(open);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this course.'));
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    load();
    api
      .get('/users/instructors')
      .then((res) => setInstructors(unwrap(res) || []))
      .catch(() => setInstructors([]));
  }, [api, load]);

  useEffect(() => {
    if (!inviteOpen) return undefined;
    const timer = setTimeout(async () => {
      setCandidateLoading(true);
      try {
        const res = await api.get(
          `/courses/${id}/invite-candidates?search=${encodeURIComponent(inviteSearch)}`,
        );
        setCandidates(unwrap(res) || []);
      } catch (err) {
        setInviteError(getErrorMessage(err, 'Unable to load students.'));
      } finally {
        setCandidateLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [api, id, inviteOpen, inviteSearch]);

  const openInvite = () => {
    setInviteOpen(true);
    setInviteSearch('');
    setCandidates([]);
    setSelectedCandidate(null);
    setAccessType('FREE');
    setInviteMessage('');
    setInviteError('');
    setInviteSuccess('');
  };

  const sendInvitation = async (event) => {
    event.preventDefault();
    if (!selectedCandidate) {
      setInviteError('Select a student to invite.');
      return;
    }
    setInviting(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const res = await api.post(`/courses/${id}/invitations`, {
        userId: selectedCandidate.id,
        accessType,
        message: inviteMessage,
      });
      const payload = unwrap(res);
      setInviteSuccess(
        payload?.requiresPayment
          ? 'Invitation sent. The student can complete payment from their Payments page.'
          : 'Invitation sent and free access granted immediately.',
      );
      const refreshed = await api.get(`/courses/${id}/invitations`).catch(() => null);
      if (refreshed) setInvitations(unwrap(refreshed) || []);
      setSelectedCandidate(null);
      setInviteMessage('');
    } catch (err) {
      setInviteError(getErrorMessage(err, 'Unable to send the invitation.'));
    } finally {
      setInviting(false);
    }
  };

  const revokeInvitation = async (invitation) => {
    if (!window.confirm('Revoke this invitation? Pending payments will be cancelled.')) return;
    try {
      await api.post(`/invitations/${invitation.id}/revoke`);
      setInvitations((prev) =>
        prev.map((item) =>
          item.id === invitation.id ? { ...item, status: 'REVOKED' } : item,
        ),
      );
    } catch (err) {
      setInviteError(getErrorMessage(err, 'Unable to revoke the invitation.'));
    }
  };

  const saveInstructors = async () => {
    setSavingInstructors(true);
    setError('');
    try {
      await api.put(`/courses/${id}/instructors`, {
        instructorId: leadId,
        coInstructorIds: coIds,
      });
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update instructors.'));
    } finally {
      setSavingInstructors(false);
    }
  };

  const openModule = (module = null) => {
    setModuleModal(module || 'new');
    setModuleForm(
      module
        ? {
            title: module.title || '',
            description: module.description || '',
            order: module.order ?? '',
            isPublished: !!module.isPublished,
            unlockAfterDays: module.unlockAfterDays ?? '',
            unlockAt: toLocalInput(module.unlockAt),
          }
        : { ...emptyModule },
    );
  };

  const saveModule = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...moduleForm,
      unlockAfterDays: moduleForm.unlockAfterDays === '' ? null : Number(moduleForm.unlockAfterDays),
      unlockAt: moduleForm.unlockAt ? new Date(moduleForm.unlockAt).toISOString() : null,
    };
    try {
      if (moduleModal === 'new') await api.post(`/courses/${id}/modules`, payload);
      else await api.patch(`/courses/modules/${moduleModal.id}`, payload);
      setModuleModal(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save the module.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (module) => {
    if (!window.confirm(`Delete module “${module.title}” and all its lessons?`)) return;
    try {
      await api.delete(`/courses/modules/${module.id}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete the module.'));
    }
  };

  const openLesson = (moduleId, lesson = null) => {
    setLessonModal(lesson || { moduleId });
    setLessonForm(
      lesson
        ? {
            title: lesson.title || '',
            description: lesson.description || '',
            readingContent: lesson.readingContent || '',
            type: lesson.type || 'VIDEO',
            contentUrl: lesson.contentUrl || '',
            duration: lesson.duration ?? '',
            order: lesson.order ?? '',
            isFree: !!lesson.isFree,
            isPublished: !!lesson.isPublished,
            unlockAfterDays: lesson.unlockAfterDays ?? '',
            unlockAt: toLocalInput(lesson.unlockAt),
          }
        : { ...emptyLesson },
    );
  };

  const saveLesson = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const moduleId = lessonModal?.moduleId;
    const payload = {
      ...lessonForm,
      duration: lessonForm.duration === '' ? null : Number(lessonForm.duration),
      order: lessonForm.order === '' ? null : Number(lessonForm.order),
      unlockAfterDays: lessonForm.unlockAfterDays === '' ? null : Number(lessonForm.unlockAfterDays),
      unlockAt: lessonForm.unlockAt ? new Date(lessonForm.unlockAt).toISOString() : null,
    };
    try {
      if (lessonModal?.id) await api.patch(`/courses/lessons/${lessonModal.id}`, payload);
      else await api.post(`/courses/modules/${moduleId}/lessons`, payload);
      setLessonModal(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save the lesson.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Delete lesson “${lesson.title}”?`)) return;
    try {
      await api.delete(`/courses/lessons/${lesson.id}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to delete the lesson.'));
    }
  };

  const saveSession = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/courses/${id}/sessions`, {
        ...sessionForm,
        startTime: new Date(sessionForm.startTime).toISOString(),
        endTime: new Date(sessionForm.endTime).toISOString(),
      });
      setSessionModal(false);
      setSessionForm(emptySession);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to schedule the session.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteSession = async (session) => {
    if (!window.confirm(`Cancel “${session.title}”?`)) return;
    try {
      await api.delete(`/courses/sessions/${session.id}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to cancel the session.'));
    }
  };

  if (loading) {
    return <Loading label="Loading course builder…" />;
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <ErrorBox message={error || 'Course not found.'} />
        <Link to="/admin/courses" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Link>
      </div>
    );
  }

  const totalLessons = (course.modules || []).reduce(
    (sum, module) => sum + (module.lessons?.length || 0),
    0,
  );

  const removeStudent = async (enrollment) => {
    const name = `${enrollment.user?.firstName || ''} ${enrollment.user?.lastName || ''}`.trim();
    if (!window.confirm(`Remove ${name} from this course? Their progress will be deleted.`)) return;
    try {
      await api.delete(`/enrollments/${enrollment.id}`);
      setEnrolled((prev) => prev.filter((item) => item.id !== enrollment.id));
      setCourse((prev) =>
        prev ? { ...prev, _count: { ...prev._count, enrollments: Math.max(0, (prev._count?.enrollments || 1) - 1) } } : prev,
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to remove that student.'));
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/admin/courses" className="hover:text-red-600">Courses</Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium text-slate-900 dark:text-white">{course.title}</span>
      </div>

      <PageHeader
        title={course.title}
        description="Build the curriculum, schedule releases, assign instructors and plan live sessions."
        actions={
          <>
            <Link to={`/admin/assignments?courseId=${id}`} className="btn-secondary">
              <ClipboardList className="h-4 w-4" /> Assignments
            </Link>
            <Link to={`/admin/attendance?courseId=${id}`} className="btn-secondary">
              <CalendarCheck className="h-4 w-4" /> Attendance
            </Link>
            <button type="button" onClick={openInvite} className="btn-secondary">
              <UserPlus className="h-4 w-4" /> Invite student
            </button>
            <button type="button" onClick={() => setSessionModal(true)} className="btn-secondary">
              <CalendarPlus className="h-4 w-4" /> Live session
            </button>
            <button type="button" onClick={() => openModule()} className="btn-primary">
              <Plus className="h-4 w-4" /> Add module
            </button>
          </>
        }
      />

      <ErrorBox message={error} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Modules', value: course.modules?.length || 0, icon: Layers },
          { label: 'Lessons', value: totalLessons, icon: PlayCircle },
          { label: 'Students', value: course._count?.enrollments || 0, icon: Users },
          { label: 'Type', value: `${course.type} · ${course.currency} ${course.price}`, icon: GraduationCap },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{item.label}</p>
              <item.icon className="h-4 w-4 text-red-500" />
            </div>
            <p className="mt-2 truncate text-xl font-extrabold text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Instructor assignment */}
      <section className="card p-5">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-red-600 dark:text-red-400" />
          <h2 className="font-bold text-slate-900 dark:text-white">Instructors</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          The lead instructor owns the course. Co-instructors can manage content, assignments and
          live sessions.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Lead instructor" htmlFor="lead-instructor">
            <select
              id="lead-instructor"
              value={leadId}
              onChange={(event) => setLeadId(event.target.value)}
              className="input-field"
            >
              {instructors.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.firstName} {person.lastName} · {person.email}
                </option>
              ))}
            </select>
          </Field>
          <div>
            <p className="label">Co-instructors</p>
            <div className="max-h-32 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
              {instructors
                .filter((person) => person.id !== leadId)
                .map((person) => (
                  <label key={person.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={coIds.includes(person.id)}
                      onChange={(event) =>
                        setCoIds((prev) =>
                          event.target.checked
                            ? [...prev, person.id]
                            : prev.filter((value) => value !== person.id),
                        )
                      }
                      className="h-4 w-4 rounded border-slate-300 text-red-600"
                    />
                    {person.firstName} {person.lastName}
                  </label>
                ))}
              {instructors.length <= 1 && (
                <p className="text-xs text-slate-400">Create more staff accounts to add co-instructors.</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={saveInstructors} disabled={savingInstructors} className="btn-primary !py-2">
            {savingInstructors ? 'Saving…' : 'Save instructors'}
          </button>
        </div>
      </section>

      {/* Enrolled students */}
      <section className="card p-5">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <Users className="h-4 w-4 text-red-600" /> Enrolled students
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Remove a student to revoke their access and clear their progress for this course.
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {enrolled.length === 0 ? (
            <p className="text-sm text-slate-400">No students enrolled yet.</p>
          ) : (
            enrolled.map((enrollment) => (
              <div key={enrollment.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                {enrollment.user?.avatar ? (
                  <img src={enrollment.user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {`${enrollment.user?.firstName?.[0] || ''}${enrollment.user?.lastName?.[0] || ''}`}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {enrollment.user?.firstName} {enrollment.user?.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {enrollment.user?.email} · {enrollment.status}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeStudent(enrollment)}
                  className="btn-secondary !border-red-200 !py-1.5 !text-red-600 text-xs dark:!border-red-900/60 dark:!text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Invitations */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <UserPlus className="h-4 w-4 text-red-600" /> Invited students
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Free invitations enrol immediately. Paid invitations create a payment request the
              student can settle from their payments page.
            </p>
          </div>
          <button type="button" onClick={openInvite} className="btn-secondary !py-2">
            <UserPlus className="h-4 w-4" /> Invite
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {invitations.length === 0 ? (
            <p className="text-sm text-slate-400">No students invited yet.</p>
          ) : (
            invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {`${invitation.user?.firstName?.[0] || ''}${invitation.user?.lastName?.[0] || ''}`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {invitation.user?.firstName} {invitation.user?.lastName}
                  </p>
                  <p className="truncate text-[11px] text-slate-400">{invitation.email}</p>
                </div>
                <span className={invitation.accessType === 'FREE' ? 'badge-success' : 'badge-info'}>
                  {invitation.accessType}
                </span>
                <span
                  className={
                    invitation.status === 'ACCEPTED'
                      ? 'badge-success'
                      : invitation.status === 'PENDING_PAYMENT'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }
                >
                  {invitation.status}
                </span>
                {invitation.payment && (
                  <span className="text-[11px] text-slate-400">
                    {invitation.payment.currency} {invitation.payment.amount} ·{' '}
                    {invitation.payment.status}
                  </span>
                )}
                {invitation.status !== 'ACCEPTED' && (
                  <button
                    type="button"
                    onClick={() => revokeInvitation(invitation)}
                    className="btn-ghost !px-2.5 !py-1.5 text-red-600"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Curriculum */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Curriculum</h2>
          <span className="text-xs text-slate-400">
            Unlocks: N days after enrolment, or at a fixed date/time.
          </span>
        </div>

        {(course.modules || []).length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No modules yet"
            description="Add your first module, then add video, PDF, slide or link lessons."
            action={
              <button type="button" onClick={() => openModule()} className="btn-primary">
                <Plus className="h-4 w-4" /> Add module
              </button>
            }
          />
        ) : (
          course.modules.map((module, moduleIndex) => {
            const open = openModules[module.id] !== false;
            return (
              <div key={module.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setOpenModules((prev) => ({ ...prev, [module.id]: !open }))}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Toggle module"
                  >
                    {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 dark:bg-slate-800">
                    {moduleIndex + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{module.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {module.lessons?.length || 0} lessons
                      {module.unlockAfterDays ? ` · unlocks day ${module.unlockAfterDays}` : ''}
                      {module.unlockAt ? ` · from ${formatDateTime(module.unlockAt)}` : ''}
                    </p>
                  </div>
                  <span className={module.isPublished ? 'badge-success' : 'badge-warning'}>
                    {module.isPublished ? 'Published' : 'Draft'}
                  </span>
                  <button type="button" onClick={() => openLesson(module.id)} className="btn-secondary !px-2.5 !py-1.5" title="Add lesson">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => openModule(module)} className="btn-secondary !px-2.5 !py-1.5" title="Edit module">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => deleteModule(module)} className="btn-ghost !px-2.5 !py-1.5 text-red-600" title="Delete module">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {open && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(module.lessons || []).length === 0 ? (
                      <p className="px-4 py-4 text-sm text-slate-400">
                        No lessons yet. Add a video, PDF, slide deck or link.
                      </p>
                    ) : (
                      module.lessons.map((lesson) => (
                        <div key={lesson.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                            {lesson.type === 'VIDEO' || lesson.type === 'YOUTUBE' ? (
                              <Video className="h-4 w-4" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                              {lesson.order}. {lesson.title}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {lesson.type} · {lesson.duration || 0} min
                              {lesson.isFree ? ' · free preview' : ''}
                              {lesson.unlockAfterDays ? ` · unlocks day ${lesson.unlockAfterDays}` : ''}
                              {lesson.unlockAt ? ` · from ${formatDateTime(lesson.unlockAt)}` : ''}
                            </p>
                          </div>
                          {!lesson.isFree && <Lock className="h-3.5 w-3.5 text-slate-300" />}
                          <span className={lesson.isPublished ? 'badge-success' : 'badge-warning'}>
                            {lesson.isPublished ? 'Live' : 'Draft'}
                          </span>
                          <button type="button" onClick={() => openLesson(module.id, lesson)} className="btn-secondary !px-2.5 !py-1.5" title="Edit lesson">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" onClick={() => deleteLesson(lesson)} className="btn-ghost !px-2.5 !py-1.5 text-red-600" title="Delete lesson">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Live sessions */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Video className="h-4 w-4 text-red-600" /> Live sessions
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Students see these on their calendar and get reminders before they start.
            </p>
          </div>
          <button type="button" onClick={() => setSessionModal(true)} className="btn-secondary !py-2">
            <Plus className="h-4 w-4" /> Schedule
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-400">No live sessions scheduled yet.</p>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                  <Clock className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{session.title}</p>
                  <p className="text-[11px] text-slate-400">
                    {formatDateTime(session.startTime)} · {session.reminderMinutesBefore} min reminder
                  </p>
                </div>
                {session.meetingUrl && (
                  <a href={session.meetingUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-red-600">
                    Join link
                  </a>
                )}
                <button type="button" onClick={() => deleteSession(session)} className="btn-ghost !px-2.5 !py-1.5 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="flex justify-between">
        <Link to="/admin/courses" className="btn-secondary">
          <ArrowLeft className="h-4 w-4" /> Back to courses
        </Link>
        <Link to="/admin/assignments" className="btn-secondary">
          <BookOpen className="h-4 w-4" /> Manage assignments
        </Link>
      </div>

      {/* Invite student modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a student"
        description="Free enrols immediately. Paid creates a payment request for the student."
        wide
      >
        <form onSubmit={sendInvitation} className="space-y-5">
          <div>
            <label htmlFor="invite-search" className="label">Find a student</label>
            <input
              id="invite-search"
              value={inviteSearch}
              onChange={(event) => setInviteSearch(event.target.value)}
              className="input-field"
              placeholder="Search by name or email…"
            />
            <div className="mt-2 max-h-44 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
              {candidateLoading ? (
                <p className="p-2 text-xs text-slate-400">Loading students…</p>
              ) : candidates.length === 0 ? (
                <p className="p-2 text-xs text-slate-400">
                  No unenrolled students found. Ask the student to register first.
                </p>
              ) : (
                candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${
                      selectedCandidate?.id === candidate.id
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-[10px] font-bold dark:bg-slate-800">
                      {`${candidate.firstName?.[0] || ''}${candidate.lastName?.[0] || ''}`}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {candidate.firstName} {candidate.lastName}
                      </span>
                      <span className="block truncate text-[11px] text-slate-400">{candidate.email}</span>
                    </span>
                    {selectedCandidate?.id === candidate.id && (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <p className="label">Access</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAccessType('FREE')}
                className={`rounded-xl border p-3 text-left text-sm ${
                  accessType === 'FREE'
                    ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-slate-900 dark:text-white">Free access</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Enrol immediately, no payment.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAccessType('PAID')}
                className={`rounded-xl border p-3 text-left text-sm ${
                  accessType === 'PAID'
                    ? 'border-amber-500 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <span className="block font-semibold text-slate-900 dark:text-white">Paid access</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {course.currency} {course.effectivePrice ?? course.price} payment request.
                </span>
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="invite-message" className="label">Message (optional)</label>
            <textarea
              id="invite-message"
              rows={3}
              value={inviteMessage}
              onChange={(event) => setInviteMessage(event.target.value)}
              className="input-field"
              placeholder="Welcome to the next cohort…"
            />
          </div>

          {inviteError && <ErrorBox message={inviteError} />}
          {inviteSuccess && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {inviteSuccess}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setInviteOpen(false)} className="btn-secondary">
              Close
            </button>
            <button type="submit" disabled={inviting || !selectedCandidate} className="btn-primary">
              <UserPlus className="h-4 w-4" />
              {inviting ? 'Sending…' : `Send ${accessType === 'FREE' ? 'free' : 'paid'} invitation`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Module modal */}
      <Modal
        open={!!moduleModal}
        onClose={() => setModuleModal(null)}
        title={moduleModal === 'new' ? 'Add module' : 'Edit module'}
        description="Set a week/day unlock to release this module after enrolment."
      >
        <form onSubmit={saveModule} className="space-y-4">
          <Field label="Title" htmlFor="module-title">
            <input id="module-title" required value={moduleForm.title} onChange={(event) => setModuleForm((prev) => ({ ...prev, title: event.target.value }))} className="input-field" />
          </Field>
          <Field label="Description" htmlFor="module-description">
            <textarea id="module-description" rows={2} value={moduleForm.description} onChange={(event) => setModuleForm((prev) => ({ ...prev, description: event.target.value }))} className="input-field" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Order" htmlFor="module-order">
              <input id="module-order" type="number" min="1" value={moduleForm.order} onChange={(event) => setModuleForm((prev) => ({ ...prev, order: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Unlock after (days)" htmlFor="module-days">
              <input id="module-days" type="number" min="0" value={moduleForm.unlockAfterDays} onChange={(event) => setModuleForm((prev) => ({ ...prev, unlockAfterDays: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Unlock at (optional)" htmlFor="module-at">
              <input id="module-at" type="datetime-local" value={moduleForm.unlockAt} onChange={(event) => setModuleForm((prev) => ({ ...prev, unlockAt: event.target.value }))} className="input-field" />
            </Field>
          </div>
          <Toggle label="Published" checked={moduleForm.isPublished} onChange={(value) => setModuleForm((prev) => ({ ...prev, isPublished: value }))} />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setModuleModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save module'}</button>
          </div>
        </form>
      </Modal>

      {/* Lesson modal */}
      <Modal
        open={!!lessonModal}
        onClose={() => setLessonModal(null)}
        title={lessonModal?.id ? 'Edit lesson' : 'Add lesson'}
        description="Videos, PDFs, slides, documents and YouTube links are supported."
        wide
      >
        <form onSubmit={saveLesson} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="lesson-title">
              <input id="lesson-title" required value={lessonForm.title} onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Type" htmlFor="lesson-type">
              <select id="lesson-type" value={lessonForm.type} onChange={(event) => setLessonForm((prev) => ({ ...prev, type: event.target.value }))} className="input-field">
                {['VIDEO', 'YOUTUBE', 'PDF', 'SLIDE', 'DOC', 'LIVE'].map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Content URL" htmlFor="lesson-url">
            <input id="lesson-url" value={lessonForm.contentUrl} onChange={(event) => setLessonForm((prev) => ({ ...prev, contentUrl: event.target.value }))} className="input-field" placeholder="https://youtube.com/… or Cloudinary URL" />
          </Field>
          <Field label="Short description" htmlFor="lesson-description">
            <textarea id="lesson-description" rows={2} value={lessonForm.description} onChange={(event) => setLessonForm((prev) => ({ ...prev, description: event.target.value }))} className="input-field" />
          </Field>

          <Field
            label="Reading guide / lesson notes"
            htmlFor="lesson-reading"
            hint="Long-form text shown in Study mode. Use headings, bullet points and examples so the lesson teaches even without the video."
          >
            <HtmlEditor
              id="lesson-reading"
              rows={12}
              value={lessonForm.readingContent}
              onChange={(readingContent) =>
                setLessonForm((prev) => ({ ...prev, readingContent }))
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Duration (min)" htmlFor="lesson-duration">
              <input id="lesson-duration" type="number" min="0" value={lessonForm.duration} onChange={(event) => setLessonForm((prev) => ({ ...prev, duration: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Order" htmlFor="lesson-order">
              <input id="lesson-order" type="number" min="1" value={lessonForm.order} onChange={(event) => setLessonForm((prev) => ({ ...prev, order: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Unlock after (days)" htmlFor="lesson-days">
              <input id="lesson-days" type="number" min="0" value={lessonForm.unlockAfterDays} onChange={(event) => setLessonForm((prev) => ({ ...prev, unlockAfterDays: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Unlock at (optional)" htmlFor="lesson-at">
              <input id="lesson-at" type="datetime-local" value={lessonForm.unlockAt} onChange={(event) => setLessonForm((prev) => ({ ...prev, unlockAt: event.target.value }))} className="input-field" />
            </Field>
          </div>
          <div className="flex flex-wrap gap-6">
            <Toggle label="Free preview" checked={lessonForm.isFree} onChange={(value) => setLessonForm((prev) => ({ ...prev, isFree: value }))} />
            <Toggle label="Published" checked={lessonForm.isPublished} onChange={(value) => setLessonForm((prev) => ({ ...prev, isPublished: value }))} />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setLessonModal(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save lesson'}</button>
          </div>
        </form>
      </Modal>

      {/* Session modal */}
      <Modal
        open={sessionModal}
        onClose={() => setSessionModal(false)}
        title="Schedule a live session"
        description="Students enrolled in this course will see it on their calendar."
      >
        <form onSubmit={saveSession} className="space-y-4">
          <Field label="Title" htmlFor="session-title">
            <input id="session-title" required value={sessionForm.title} onChange={(event) => setSessionForm((prev) => ({ ...prev, title: event.target.value }))} className="input-field" />
          </Field>
          <Field label="Description" htmlFor="session-description">
            <textarea id="session-description" rows={2} value={sessionForm.description} onChange={(event) => setSessionForm((prev) => ({ ...prev, description: event.target.value }))} className="input-field" />
          </Field>
          <Field label="Meeting URL" htmlFor="session-url">
            <input id="session-url" value={sessionForm.meetingUrl} onChange={(event) => setSessionForm((prev) => ({ ...prev, meetingUrl: event.target.value }))} className="input-field" placeholder="https://meet.google.com/…" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" htmlFor="session-start">
              <input id="session-start" type="datetime-local" required value={sessionForm.startTime} onChange={(event) => setSessionForm((prev) => ({ ...prev, startTime: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Ends" htmlFor="session-end">
              <input id="session-end" type="datetime-local" required value={sessionForm.endTime} onChange={(event) => setSessionForm((prev) => ({ ...prev, endTime: event.target.value }))} className="input-field" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Reminder (minutes before)" htmlFor="session-reminder">
              <input id="session-reminder" type="number" min="5" value={sessionForm.reminderMinutesBefore} onChange={(event) => setSessionForm((prev) => ({ ...prev, reminderMinutesBefore: event.target.value }))} className="input-field" />
            </Field>
            <Field label="Timezone" htmlFor="session-tz">
              <input id="session-tz" value={sessionForm.timezone} onChange={(event) => setSessionForm((prev) => ({ ...prev, timezone: event.target.value }))} className="input-field" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setSessionModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Schedule session'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCourseBuilder;
