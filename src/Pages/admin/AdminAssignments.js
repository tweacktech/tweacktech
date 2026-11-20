import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Upload,
  Users,
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
  formatDate,
  formatDateTime,
} from '../../Component/admin/AdminUI';
import QuizBuilder from '../../Component/admin/QuizBuilder';
import { getPusher } from '../../lib/pusher';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const emptyForm = {
  title: '',
  description: '',
  instructions: '',
  type: 'TEXT',
  dueAt: '',
  maxScore: 100,
  isPublished: true,
};

const AdminAssignments = () => {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [searchParams] = useSearchParams();
  const courseParam = searchParams.get('courseId') || '';
  const [courseId, setCourseId] = useState(courseParam);
  const [assignments, setAssignments] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [submissionsFor, setSubmissionsFor] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subError, setSubError] = useState('');
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [quizFor, setQuizFor] = useState(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/courses/admin/all?limit=100')
      .then((res) => {
        if (cancelled) return;
        const data = unwrap(res);
        const list = data?.data || [];
        setCourses(list);
        if (courseParam && list.some((item) => item.id === courseParam)) {
          setCourseId(courseParam);
        } else if (list.length > 0) setCourseId(list[0].id);
      })
      .catch(() => setCourses([]))
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
      const res = await api.get(`/assignments/course/${courseId}`);
      setAssignments(unwrap(res) || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load assignments.');
    } finally {
      setLoading(false);
    }
  }, [api, courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const pusher = getPusher();
    if (!pusher) return undefined;
    const channel = pusher.subscribe('private-admin');
    const refresh = (data) => {
      load();
      if (submissionsFor && data?.assignmentId === submissionsFor.id) {
        api
          .get(`/assignments/${submissionsFor.id}/submissions`)
          .then((res) => setSubmissions(unwrap(res) || []))
          .catch(() => undefined);
      }
      window.dispatchEvent(
        new CustomEvent('tweack:notification', {
          detail: {
            id: `assignment-${Date.now()}`,
            title: data?.autoGraded ? 'Quiz submitted' : 'Assignment submitted',
            body: 'A student submitted work for review.',
            link: '/admin/assignments',
          },
        }),
      );
    };
    channel.bind('assignment:submitted', refresh);
    return () => {
      channel.unbind('assignment:submitted', refresh);
    };
  }, [api, load, submissionsFor]);

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

  const openEdit = (assignment) => {
    setEditingId(assignment.id);
    setForm({
      title: assignment.title || '',
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      type: assignment.type || 'TEXT',
      dueAt: assignment.dueAt
        ? new Date(assignment.dueAt).toISOString().slice(0, 16)
        : '',
      maxScore: assignment.maxScore ?? 100,
      isPublished: !!assignment.isPublished,
    });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        maxScore: Number(form.maxScore) || 100,
      };
      const res = editingId
        ? await api.put(`/assignments/${editingId}`, payload)
        : await api.post(`/assignments/course/${courseId}`, payload);
      const saved = unwrap(res);
      setModalOpen(false);
      load();
      if (saved?.type === 'QUIZ') setQuizFor(saved);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the assignment.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (assignment) => {
    if (!window.confirm(`Delete “${assignment.title}”?`)) return;
    try {
      await api.delete(`/assignments/${assignment.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete the assignment.');
    }
  };

  const openSubmissions = async (assignment) => {
    setSubmissionsFor(assignment);
    setSubmissions([]);
    setSubError('');
    setSubsLoading(true);
    try {
      const res = await api.get(`/assignments/${assignment.id}/submissions`);
      setSubmissions(unwrap(res) || []);
    } catch (err) {
      setSubError(err.response?.data?.message || 'Unable to load submissions.');
    } finally {
      setSubsLoading(false);
    }
  };

  const startGrading = (submission) => {
    setGrading(submission);
    setGradeForm({
      score: submission.score ?? '',
      feedback: submission.feedback || '',
    });
  };

  const saveGrade = async (e) => {
    e.preventDefault();
    if (!grading) return;
    try {
      const res = await api.patch(`/assignments/submissions/${grading.id}/grade`, {
        score: gradeForm.score,
        feedback: gradeForm.feedback,
      });
      const updated = unwrap(res);
      setSubmissions((prev) =>
        prev.map((s) => (s.id === grading.id ? { ...s, ...updated } : s))
      );
      setGrading(null);
    } catch (err) {
      setSubError(err.response?.data?.message || 'Unable to save the grade.');
    }
  };

  const bulkCreate = async () => {
    setBulkSaving(true);
    setError('');
    setBulkResult(null);
    try {
      let parsed;
      try {
        parsed = JSON.parse(bulkText);
      } catch {
        throw new Error('The bulk text is not valid JSON.');
      }
      if (!Array.isArray(parsed)) parsed = parsed.assignments;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('Provide a JSON array of assignments.');
      }
      const res = await api.post(`/assignments/course/${courseId}/bulk`, {
        assignments: parsed,
      });
      setBulkResult(unwrap(res));
      setBulkText('');
      load();
    } catch (err) {
      setError(
        err?.response ? err.response?.data?.message || 'Unable to bulk create.' : err.message,
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const selectedCourse = courses.find((c) => c.id === courseId);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Assignments"
        description="Create assignments per course, review submissions, and grade students."
        actions={
          <>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="btn-secondary"
              disabled={!courseId}
            >
              <Upload className="h-4 w-4" /> Bulk create
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary"
              disabled={!courseId}
            >
              <Plus className="h-4 w-4" /> New assignment
            </button>
          </>
        }
      />

      <ErrorBox message={error} />

      <div className="card p-4">
        <Field label="Course" htmlFor="course-select">
          <select
            id="course-select"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="input-field"
            disabled={loadingCourses}
          >
            {courses.length === 0 && <option value="">No courses available</option>}
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </Field>
        {selectedCourse && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {selectedCourse._count?.enrollments ?? 0} enrolled students ·{' '}
            {selectedCourse.duration || 'No duration set'}
          </p>
        )}
      </div>

      {loading ? (
        <Loading label="Loading assignments…" />
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No assignments for this course"
          description="Add an assignment so students can practise and receive feedback."
          action={
            courseId ? (
              <button type="button" onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> New assignment
              </button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {assignment.title}
                    </h3>
                    <span className={assignment.isPublished ? 'badge-success' : 'badge-warning'}>
                      {assignment.isPublished ? 'Published' : 'Draft'}
                    </span>
                    <span className="badge-neutral">{assignment.type}</span>
                  </div>
                  {assignment.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                      {assignment.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>Due {formatDate(assignment.dueAt)}</span>
                    <span>Max score {assignment.maxScore}</span>
                    <span>{assignment._count?.submissions ?? 0} submissions</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {assignment.type === 'QUIZ' && (
                    <button
                      type="button"
                      onClick={() => setQuizFor(assignment)}
                      className="btn-secondary !py-2"
                    >
                      <ListChecks className="h-4 w-4" /> Questions
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openSubmissions(assignment)}
                    className="btn-secondary !py-2"
                  >
                    <Users className="h-4 w-4" /> Submissions
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(assignment)}
                    className="btn-secondary !px-3 !py-2"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(assignment)}
                    className="btn-ghost !px-3 !py-2 text-red-600 dark:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit assignment' : 'New assignment'}
        description={selectedCourse ? `For ${selectedCourse.title}` : ''}
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <Field label="Title" htmlFor="a-title">
            <input id="a-title" required value={form.title} onChange={update('title')} className="input-field" />
          </Field>

          <Field label="Short description" htmlFor="a-desc">
            <textarea id="a-desc" rows={3} value={form.description} onChange={update('description')} className="input-field" />
          </Field>

          <Field label="Instructions" htmlFor="a-instructions">
            <textarea id="a-instructions" rows={4} value={form.instructions} onChange={update('instructions')} className="input-field" />
          </Field>

          {form.type === 'QUIZ' && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
              Save the quiz first, then add questions. Quizzes are auto-marked and can be
              imported in bulk from the quiz builder.
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Submission type" htmlFor="a-type">
              <select id="a-type" value={form.type} onChange={update('type')} className="input-field">
                <option value="TEXT">Text answer</option>
                <option value="FILE">File upload</option>
                <option value="PROJECT">Project</option>
                <option value="QUIZ">Quiz</option>
              </select>
            </Field>
            <Field label="Due date" htmlFor="a-due">
              <input id="a-due" type="datetime-local" value={form.dueAt} onChange={update('dueAt')} className="input-field" />
            </Field>
            <Field label="Max score" htmlFor="a-score">
              <input id="a-score" type="number" min="1" value={form.maxScore} onChange={update('maxScore')} className="input-field" />
            </Field>
          </div>

          <Toggle
            label="Published (visible to students)"
            checked={form.isPublished}
            onChange={(v) => setForm((p) => ({ ...p, isPublished: v }))}
          />

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create assignment'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!submissionsFor}
        onClose={() => setSubmissionsFor(null)}
        title={submissionsFor ? `Submissions · ${submissionsFor.title}` : 'Submissions'}
        description="Review work and record a score with feedback."
        wide
      >
        {subError && <ErrorBox message={subError} />}

        {grading ? (
          <form onSubmit={saveGrade} className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {grading.user?.firstName} {grading.user?.lastName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submitted {formatDateTime(grading.submittedAt)}
              </p>
              {grading.content && (
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                  {grading.content}
                </p>
              )}
              {grading.fileUrl && (
                <a
                  href={grading.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-red-600 dark:text-red-400"
                >
                  Open submitted file
                </a>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label={`Score (max ${submissionsFor?.maxScore ?? 100})`} htmlFor="grade-score">
                <input
                  id="grade-score"
                  type="number"
                  min="0"
                  max={submissionsFor?.maxScore ?? 100}
                  value={gradeForm.score}
                  onChange={(e) => setGradeForm((p) => ({ ...p, score: e.target.value }))}
                  className="input-field"
                  required
                />
              </Field>
              <Field label="Feedback" htmlFor="grade-feedback" className="sm:col-span-2">
                <textarea
                  id="grade-feedback"
                  rows={3}
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm((p) => ({ ...p, feedback: e.target.value }))}
                  className="input-field"
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setGrading(null)} className="btn-secondary">
                Back
              </button>
              <button type="submit" className="btn-primary">
                <CheckCircle2 className="h-4 w-4" /> Save grade
              </button>
            </div>
          </form>
        ) : subsLoading ? (
          <Loading label="Loading submissions…" />
        ) : submissions.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No submissions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
              >
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                  {`${submission.user?.firstName?.[0] || ''}${submission.user?.lastName?.[0] || ''}`}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {submission.user?.firstName} {submission.user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {submission.user?.email} · {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      submission.status === 'GRADED'
                        ? 'badge-success'
                        : submission.status === 'LATE'
                        ? 'badge-danger'
                        : 'badge-warning'
                    }
                  >
                    {submission.status}
                  </span>
                  {submission.score !== null && submission.score !== undefined && (
                    <span className="badge-info">{submission.score} pts</span>
                  )}
                  <button
                    type="button"
                    onClick={() => startGrading(submission)}
                    className="btn-secondary !px-3 !py-1.5"
                  >
                    <Award className="h-3.5 w-3.5" /> Grade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <QuizBuilder
        api={api}
        assignment={quizFor}
        onClose={() => setQuizFor(null)}
        onChanged={load}
      />

      <Modal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk create assignments"
        description="Paste a JSON array. Each item uses the same fields as the single form."
        wide
      >
        <div className="space-y-4">
          {bulkResult && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              Created {bulkResult.count} assignment{bulkResult.count === 1 ? '' : 's'}.
              {bulkResult.errors?.length > 0 && ` ${bulkResult.errors.length} failed.`}
            </div>
          )}
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Example: <code>{`[{"title":"Week 1 quiz","type":"TEXT","maxScore":100,"dueAt":"2026-12-01T10:00:00Z"}]`}</code>
          </p>
          <textarea
            rows={12}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            className="input-field font-mono text-xs"
            placeholder='[{"title":"...","description":"...","type":"QUIZ","maxScore":10}]'
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setBulkOpen(false)} className="btn-secondary">
              Close
            </button>
            <button
              type="button"
              onClick={bulkCreate}
              disabled={bulkSaving || !bulkText.trim()}
              className="btn-primary"
            >
              <Upload className="h-4 w-4" /> {bulkSaving ? 'Creating…' : 'Create assignments'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminAssignments;
