import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { normalizeImageUrl } from '../../lib/image';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Save,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import {
  EmptyState,
  ErrorBox,
  Loading,
  PageHeader,
  formatDate,
} from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const todayISO = () => {
  const now = new Date();
  const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return utc.toISOString().slice(0, 10);
};

const initials = (person) =>
  `${person?.firstName?.[0] || ''}${person?.lastName?.[0] || ''}`.toUpperCase() || 'ST';

const AdminAttendance = () => {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [searchParams] = useSearchParams();
  const courseParam = searchParams.get('courseId') || '';
  const [courseId, setCourseId] = useState(courseParam);
  const [date, setDate] = useState(todayISO());
  const [data, setData] = useState(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [draftScores, setDraftScores] = useState({});
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/courses/teaching')
      .then((res) => {
        if (cancelled) return;
        const list = unwrap(res)?.data || [];
        setCourses(list);
        if (courseParam && list.some((item) => item.id === courseParam)) {
          setCourseId(courseParam);
        } else if (list.length) setCourseId(list[0].id);
      })
      .catch(() => !cancelled && setError('Unable to load your courses.'))
      .finally(() => !cancelled && setLoadingCourses(false));
    return () => {
      cancelled = true;
    };
  }, [api, courseParam]);

  const load = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    setError('');
    try {
      const body = unwrap(await api.get(`/attendance?courseId=${courseId}&date=${date}`));
      setData(body);
      const scores = {};
      (body?.students || []).forEach((student) => {
        scores[student.id] =
          student.record?.score === null || student.record?.score === undefined
            ? ''
            : String(student.record.score);
      });
      setDraftScores(scores);
    } catch (err) {
      setError(
        err?.response?.status === 403
          ? 'You can only take attendance for courses assigned to you.'
          : 'Unable to load attendance for that course and date.',
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [api, courseId, date]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const mark = async (student, payload, quiet = false) => {
    setSaving((prev) => ({ ...prev, [student.id]: true }));
    setError('');
    try {
      const record = unwrap(
        await api.post('/attendance/mark', {
          courseId,
          studentId: student.id,
          date,
          ...payload,
        }),
      );
      setData((prev) => {
        if (!prev) return prev;
        const students = prev.students.map((item) =>
          item.id === student.id ? { ...item, record } : item,
        );
        const present = students.filter((item) => item.record?.isPresent).length;
        const markedCount = students.filter((item) => item.record).length;
        const scores = students
          .map((item) => item.record?.score)
          .filter((score) => typeof score === 'number');
        return {
          ...prev,
          students,
          summary: {
            ...prev.summary,
            marked: markedCount,
            present,
            absent: markedCount - present,
            unmarked: students.length - markedCount,
            attendanceRate: students.length
              ? Math.round((present / students.length) * 100)
              : 0,
            averageScore: scores.length
              ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
              : null,
          },
        };
      });
      if (!quiet) {
        setToast(
          `${student.firstName} marked ${record?.isPresent ? 'present' : 'absent'}`,
        );
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to save attendance.');
    } finally {
      setSaving((prev) => ({ ...prev, [student.id]: false }));
    }
  };

  const saveScore = async (student, rawOverride) => {
    const raw = rawOverride ?? draftScores[student.id] ?? '';
    if (raw !== '' && (Number(raw) < 0 || Number(raw) > 100 || Number.isNaN(Number(raw)))) {
      setError('Scores must be between 0 and 100.');
      return;
    }
    const current = student.record?.score ?? '';
    if (String(current) === String(raw)) return;
    await mark(student, { score: raw === '' ? null : Number(raw) });
  };

  const markAllPresent = async () => {
    setError('');
    try {
      await api.post('/attendance/mark-all', {
        courseId,
        date,
        isPresent: true,
        studentIds: (data?.students || []).map((student) => student.id),
      });
      setToast('Everyone marked present');
      load();
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to mark everyone present.');
    }
  };

  const summary = data?.summary;
  const presentCount = summary?.present || 0;
  const rate = summary?.attendanceRate || 0;

  const stats = useMemo(
    () => [
      { label: 'Students', value: summary?.total ?? 0, tone: 'text-slate-900 dark:text-white' },
      { label: 'Present', value: presentCount, tone: 'text-emerald-600' },
      { label: 'Absent', value: summary?.absent ?? 0, tone: 'text-red-600' },
      { label: 'Unmarked', value: summary?.unmarked ?? 0, tone: 'text-amber-600' },
      { label: 'Average score', value: summary?.averageScore ?? '—', tone: 'text-sky-600' },
    ],
    [summary, presentCount],
  );

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Attendance & scores"
        description="Mark students present or absent for any date and record scores that feed into grading."
        actions={
          data?.students?.length ? (
            <button type="button" onClick={markAllPresent} className="btn-primary">
              <UserCheck className="h-4 w-4" /> Mark all present
            </button>
          ) : null
        }
      />

      {error && <ErrorBox message={error} />}

      <div className="card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="attendance-course" className="label">
              Course
            </label>
            <select
              id="attendance-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              className="input-field"
              disabled={loadingCourses || courses.length === 0}
            >
              {courses.length === 0 && <option value="">No courses assigned</option>}
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="attendance-date" className="label">
              Date
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="attendance-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {loadingCourses ? (
        <Loading label="Loading your courses…" />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No courses assigned yet"
          description="Attendance becomes available once a course is assigned to you."
        />
      ) : loading ? (
        <Loading label="Loading attendance…" />
      ) : !data?.students?.length ? (
        <EmptyState
          icon={Users}
          title="No enrolled students"
          description="Students will appear here as soon as they enrol in this course."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((item) => (
              <div key={item.label} className="card p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {item.label}
                </p>
                <p className={`mt-1 text-2xl font-extrabold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {data.course?.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatDate(date)} · {rate}% attendance recorded
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{rate}%</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.students.map((student) => {
                const isPresent = student.record?.isPresent === true;
                const isMarked = Boolean(student.record);
                const isSaving = saving[student.id];
                return (
                  <div
                    key={student.id}
                    className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {student.avatar ? (
                        <img src={normalizeImageUrl(student.avatar)} alt="" className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {initials(student)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {student.email}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          Overall {student.stats?.rate || 0}% · {student.stats?.marked || 0} sessions
                          {student.stats?.averageScore !== null &&
                            student.stats?.averageScore !== undefined &&
                            ` · avg ${student.stats.averageScore}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pl-0 sm:pl-0">
                      <button
                        type="button"
                        onClick={() => mark(student, { isPresent: true })}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                          isMarked && isPresent
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                        aria-pressed={isMarked && isPresent}
                      >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Present
                      </button>
                      <button
                        type="button"
                        onClick={() => mark(student, { isPresent: false })}
                        disabled={isSaving}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                          isMarked && !isPresent
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                        aria-pressed={isMarked && !isPresent}
                      >
                        <X className="h-3.5 w-3.5" /> Absent
                      </button>

                      <div className="flex items-center gap-1.5">
                        <label
                          htmlFor={`score-${student.id}`}
                          className="text-[11px] font-semibold text-slate-500 dark:text-slate-400"
                        >
                          Score
                        </label>
                        <input
                          id={`score-${student.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={draftScores[student.id] ?? ''}
                          onChange={(event) =>
                            setDraftScores((prev) => ({ ...prev, [student.id]: event.target.value }))
                          }
                          onBlur={(event) => saveScore(student, event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              saveScore(student);
                            }
                          }}
                          placeholder="—"
                          className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs font-semibold text-slate-900 focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => saveScore(student)}
                          disabled={isSaving}
                          className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-red-600 dark:hover:bg-slate-800"
                          aria-label={`Save score for ${student.firstName}`}
                          title="Save score"
                        >
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          !isMarked
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : isPresent
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                        }`}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        {!isMarked ? 'Unmarked' : isPresent ? 'Present' : 'Absent'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[95] -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900">
          {toast}
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;
