import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
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
  Pagination,
  Toggle,
  formatMoney,
} from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);
const toLocalInput = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');

const emptyForm = {
  title: '',
  slug: '',
  shortDescription: '',
  description: '',
  type: 'FREE',
  price: 0,
  currency: 'USD',
  discountPrice: '',
  discountStart: '',
  discountEnd: '',
  enrollmentLocked: false,
  enrollmentLockedMessage: '',
  instructorId: '',
  coInstructorIds: [],
  level: 'Beginner',
  duration: '8 weeks',
  categoryId: '',
  thumbnail: '',
  requirements: '',
  outcomes: '',
  targetAudience: '',
  isPublished: true,
  isFeatured: false,
};

const AdminCourses = () => {
  const { api, user, isAdmin } = useAuth();
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '8' });
      if (search) params.set('search', search);
      const res = await api.get(`/courses/admin/all?${params.toString()}`);
      const data = unwrap(res);
      setCourses(data?.data || []);
      setMeta(data?.meta || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load courses.');
    } finally {
      setLoading(false);
    }
  }, [api, page, search]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    api
      .get('/courses/categories')
      .then((res) => setCategories(unwrap(res) || []))
      .catch(() => setCategories([]));
    api
      .get('/users/instructors')
      .then((res) => setInstructors(unwrap(res) || []))
      .catch(() => setInstructors([]));
  }, [api]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id || '',
      instructorId: user?.id || instructors[0]?.id || '',
    });
    setModalOpen(true);
  };

  const openEdit = (course) => {
    setEditingId(course.id);
    setForm({
      title: course.title || '',
      slug: course.slug || '',
      shortDescription: course.shortDescription || '',
      description: course.description || '',
      type: course.type || 'FREE',
      price: course.price ?? 0,
      currency: course.currency || 'USD',
      discountPrice: course.discountPrice ?? '',
      discountStart: course.discountStart ? toLocalInput(course.discountStart) : '',
      discountEnd: course.discountEnd ? toLocalInput(course.discountEnd) : '',
      enrollmentLocked: !!course.enrollmentLocked,
      enrollmentLockedMessage: course.enrollmentLockedMessage || '',
      instructorId: course.instructorId || course.instructor?.id || '',
      coInstructorIds: (course.instructors || []).map((row) => row.userId),
      level: course.level || 'Beginner',
      duration: course.duration || '',
      categoryId: course.categoryId || '',
      thumbnail: course.thumbnail || '',
      requirements: parseList(course.requirements),
      outcomes: parseList(course.outcomes),
      targetAudience: course.targetAudience || '',
      isPublished: !!course.isPublished,
      isFeatured: !!course.isFeatured,
    });
    setModalOpen(true);
  };

  function parseList(value) {
    if (!value) return '';
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.join('\n') : String(value);
    } catch {
      return String(value);
    }
  }

  const update = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      price: Number(form.price) || 0,
      discountPrice:
        form.discountPrice === '' || form.discountPrice === null
          ? null
          : Number(form.discountPrice),
      discountStart: form.discountStart ? new Date(form.discountStart).toISOString() : null,
      discountEnd: form.discountEnd ? new Date(form.discountEnd).toISOString() : null,
      enrollmentLocked: !!form.enrollmentLocked,
      coInstructorIds: undefined,
      requirements: JSON.stringify(
        form.requirements.split('\n').map((s) => s.trim()).filter(Boolean)
      ),
      outcomes: JSON.stringify(
        form.outcomes.split('\n').map((s) => s.trim()).filter(Boolean)
      ),
    };
    try {
      const res = editingId
        ? await api.put(`/courses/${editingId}`, payload)
        : await api.post('/courses', payload);
      const saved = unwrap(res);
      if (isAdmin && saved?.id) {
        await api
          .put(`/courses/${saved.id}/instructors`, {
            instructorId: form.instructorId || saved.instructorId,
            coInstructorIds: form.coInstructorIds,
          })
          .catch(() => undefined);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the course.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (course) => {
    if (!window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return;
    try {
      await api.delete(`/courses/${course.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete the course.');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Courses"
        description="Create, publish, and curate the course catalog."
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New course
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
            placeholder="Search courses…"
          />
        </div>
      </div>

      {loading ? (
        <Loading label="Loading courses…" />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start enrolling students."
          action={
            <button type="button" onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> New course
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="card overflow-hidden card-hover">
              <div className="relative h-36 bg-slate-100 dark:bg-slate-800">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-slate-400">
                    <BookOpen className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute left-3 top-3 flex gap-1">
                  <span
                    className={
                      course.isPublished
                        ? 'badge bg-emerald-500 text-white shadow-sm'
                        : 'badge bg-amber-400 text-amber-950 shadow-sm'
                    }
                  >
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                  {course.isFeatured && (
                    <span className="badge bg-red-600 text-white shadow-sm">Featured</span>
                  )}
                  {course.enrollmentLocked && (
                    <span className="badge bg-slate-900 text-amber-200 shadow-sm">Locked</span>
                  )}
                  {course.discountPrice != null && (
                    <span className="badge bg-emerald-600 text-white shadow-sm">Discount</span>
                  )}
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
                  {course.category?.name || 'Uncategorised'}
                </p>
                <h3 className="mt-1 line-clamp-2 font-bold text-slate-900 dark:text-white">
                  {course.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                  {course.shortDescription || course.description}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                  <Users className="h-3 w-3" />
                  {course.instructor?.firstName
                    ? `${course.instructor.firstName} ${course.instructor.lastName}`
                    : 'No instructor'}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="badge-neutral">{course.type}</span>
                  <span>{formatMoney(course.price, course.currency)}</span>
                  <span>· {course.duration}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span>{course._count?.enrollments ?? 0} students</span>
                  <span>{course._count?.modules ?? 0} modules</span>
                  {course.isFeatured && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                    </span>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    to={`/admin/courses/${course.id}`}
                    className="btn-secondary flex-1 !py-2"
                  >
                    <Layers className="h-3.5 w-3.5" /> Content
                  </Link>
                  <button
                    type="button"
                    onClick={() => openEdit(course)}
                    className="btn-secondary !px-3 !py-2"
                    title="Edit course details"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(course)}
                    className="btn-ghost !px-3 !py-2 text-red-600 dark:text-red-400"
                    aria-label="Delete course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination meta={meta} onPage={setPage} />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit course' : 'Create course'}
        description="Changes go live immediately when the course is published."
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="title">
              <input id="title" required value={form.title} onChange={update('title')} className="input-field" />
            </Field>
            <Field label="Slug" htmlFor="slug" hint="Leave blank to generate from the title.">
              <input id="slug" value={form.slug} onChange={update('slug')} className="input-field" />
            </Field>
          </div>

          <Field label="Short description" htmlFor="shortDescription">
            <input
              id="shortDescription"
              value={form.shortDescription}
              onChange={update('shortDescription')}
              className="input-field"
            />
          </Field>

          <Field label="Full description" htmlFor="description">
            <textarea
              id="description"
              required
              rows={4}
              value={form.description}
              onChange={update('description')}
              className="input-field"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Type" htmlFor="type">
              <select id="type" value={form.type} onChange={update('type')} className="input-field">
                <option value="FREE">Free</option>
                <option value="PAID">Paid</option>
                <option value="PARTIAL">Partial payment</option>
              </select>
            </Field>
            <Field label={`Price (${form.currency})`} htmlFor="price">
              <input id="price" type="number" min="0" step="0.01" value={form.price} onChange={update('price')} className="input-field" />
            </Field>
            <Field label="Currency" htmlFor="currency">
              <select id="currency" value={form.currency} onChange={update('currency')} className="input-field">
                <option>USD</option><option>NGN</option><option>GHS</option><option>GBP</option><option>EUR</option>
              </select>
            </Field>
            <Field label="Level" htmlFor="level">
              <select id="level" value={form.level} onChange={update('level')} className="input-field">
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </Field>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Discount window
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Leave the discount price blank to sell at the normal price. The active price is applied to checkout automatically.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label={`Discount price (${form.currency})`} htmlFor="discountPrice">
                <input
                  id="discountPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={update('discountPrice')}
                  className="input-field"
                  placeholder="e.g. 49.99"
                />
              </Field>
              <Field label="Starts" htmlFor="discountStart">
                <input
                  id="discountStart"
                  type="datetime-local"
                  value={form.discountStart}
                  onChange={update('discountStart')}
                  className="input-field"
                />
              </Field>
              <Field label="Ends" htmlFor="discountEnd">
                <input
                  id="discountEnd"
                  type="datetime-local"
                  value={form.discountEnd}
                  onChange={update('discountEnd')}
                  className="input-field"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
            <Toggle
              label="Lock enrolment (hide the enrol button)"
              checked={form.enrollmentLocked}
              onChange={(value) => setForm((prev) => ({ ...prev, enrollmentLocked: value }))}
            />
            {form.enrollmentLocked && (
              <Field label="Message shown to students" htmlFor="enrollmentLockedMessage">
                <input
                  id="enrollmentLockedMessage"
                  value={form.enrollmentLockedMessage}
                  onChange={update('enrollmentLockedMessage')}
                  className="input-field"
                  placeholder="Enrolment for the next cohort opens in January."
                />
              </Field>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Lead instructor" htmlFor="instructorId">
              <select id="instructorId" value={form.instructorId} onChange={update('instructorId')} className="input-field">
                {instructors.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.firstName} {person.lastName}
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <p className="label">Co-instructors</p>
              <div className="max-h-28 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-700">
                {instructors.filter((person) => person.id !== form.instructorId).map((person) => (
                  <label key={person.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.coInstructorIds.includes(person.id)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          coInstructorIds: e.target.checked
                            ? [...prev.coInstructorIds, person.id]
                            : prev.coInstructorIds.filter((id) => id !== person.id),
                        }))
                      }
                      className="h-3.5 w-3.5 rounded border-slate-300 text-red-600"
                    />
                    {person.firstName} {person.lastName}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration" htmlFor="duration" hint="e.g. 8 weeks">
              <input id="duration" value={form.duration} onChange={update('duration')} className="input-field" />
            </Field>
            <Field label="Category" htmlFor="categoryId">
              <select id="categoryId" value={form.categoryId} onChange={update('categoryId')} className="input-field">
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Thumbnail URL" htmlFor="thumbnail">
            <input id="thumbnail" value={form.thumbnail} onChange={update('thumbnail')} className="input-field" placeholder="https://…" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Requirements" htmlFor="requirements" hint="One per line">
              <textarea id="requirements" rows={3} value={form.requirements} onChange={update('requirements')} className="input-field" />
            </Field>
            <Field label="Learning outcomes" htmlFor="outcomes" hint="One per line">
              <textarea id="outcomes" rows={3} value={form.outcomes} onChange={update('outcomes')} className="input-field" />
            </Field>
          </div>

          <Field label="Target audience" htmlFor="targetAudience">
            <input id="targetAudience" value={form.targetAudience} onChange={update('targetAudience')} className="input-field" />
          </Field>

          <div className="flex flex-wrap gap-6 pt-2">
            <Toggle label="Published" checked={form.isPublished} onChange={(v) => setForm((p) => ({ ...p, isPublished: v }))} />
            <Toggle label="Featured" checked={form.isFeatured} onChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create course'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminCourses;
