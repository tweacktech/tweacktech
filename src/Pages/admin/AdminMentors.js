import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Camera,
  ExternalLink,
  Loader2,
  Pencil,
  Search,
  Star,
  Users,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import {
  EmptyState,
  ErrorBox,
  Loading,
  Modal,
  PageHeader,
  Toggle,
} from '../../Component/admin/AdminUI';
import { getErrorMessage } from '../../lib/apiError';
import { normalizeImageUrl } from '../../lib/image';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const emptyForm = {
  headline: '',
  bio: '',
  qualifications: '',
  skills: '',
  yearsExperience: '',
  linkedin: '',
  twitter: '',
  website: '',
  bannerImage: '',
  isPublished: true,
  isFeatured: false,
};

const AdminMentors = () => {
  const { api } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = unwrap(await api.get('/mentors/admin/all'));
      setMentors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load mentor profiles.'));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  const openEdit = (mentor) => {
    setForm({
      headline: mentor.headline || '',
      bio: mentor.bio || '',
      qualifications: (mentor.qualifications || []).join(', '),
      skills: (mentor.skills || []).join(', '),
      yearsExperience: mentor.yearsExperience ?? '',
      linkedin: mentor.linkedin || '',
      twitter: mentor.twitter || '',
      website: mentor.website || '',
      bannerImage: mentor.bannerImage || '',
      isPublished: mentor.isPublished !== false,
      isFeatured: !!mentor.isFeatured,
    });
    setFormError('');
    setEditing(mentor);
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormError('Choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setFormError('Images must be 4MB or smaller.');
      return;
    }
    setUploading(true);
    setFormError('');
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('folder', 'mentors');
      const uploaded = unwrap(await api.post('/media/upload', payload));
      if (!uploaded?.url) throw new Error('Upload failed');
      setForm((prev) => ({ ...prev, bannerImage: uploaded.url }));
      setNotice('Image uploaded — save to apply it.');
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to upload that image.'));
    } finally {
      setUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (!editing) return;
    if (!form.headline.trim()) {
      setFormError('A headline is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const updated = unwrap(
        await api.put(`/mentors/admin/${editing.userId}`, form),
      );
      setMentors((prev) => prev.map((item) => (item.userId === editing.userId ? { ...item, ...updated } : item)));
      setNotice('Mentor profile updated.');
      setEditing(null);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to save this mentor profile.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleFeatured = async (mentor) => {
    try {
      const updated = unwrap(
        await api.patch(`/mentors/admin/${mentor.userId}/featured`, {
          isFeatured: !mentor.isFeatured,
        }),
      );
      setMentors((prev) =>
        prev.map((item) => (item.userId === mentor.userId ? { ...item, ...updated } : item)),
      );
      setNotice(updated.isFeatured ? 'Mentor featured on the site.' : 'Mentor removed from featured.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update featured status.'));
    }
  };

  const filtered = mentors.filter((mentor) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    const name = `${mentor.user?.firstName || ''} ${mentor.user?.lastName || ''}`;
    return (
      name.toLowerCase().includes(term) ||
      mentor.headline?.toLowerCase().includes(term) ||
      (mentor.skills || []).some((skill) => skill.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Mentors"
        description="Manage public mentor banners, qualifications, skills and featured placement."
        actions={<Link to="/mentors" className="btn-secondary"><ExternalLink className="h-4 w-4" /> View public page</Link>}
      />

      {notice && !editing && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </p>
      )}
      {error && <ErrorBox message={error} />}

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search mentors, skills or headlines…"
            className="input-field pl-10"
            aria-label="Search mentors"
          />
        </div>
      </div>

      {loading ? (
        <Loading label="Loading mentors…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={mentors.length ? 'No mentors match that search' : 'No mentor profiles yet'}
          description={
            mentors.length
              ? 'Try a different search term.'
              : 'Staff and admins can publish a mentor profile from their own Profile page.'
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((mentor) => (
            <div key={mentor.userId} className="card overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-slate-900 to-red-800" />
              <div className="px-4 pb-4">
                <div className="-mt-8 flex items-end gap-3">
                  {mentor.bannerImage || mentor.user?.avatar ? (
                    <img
                      src={normalizeImageUrl(mentor.bannerImage || mentor.user.avatar)}
                      alt=""
                      className="h-16 w-16 rounded-xl border-4 border-white object-cover dark:border-slate-900"
                    />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-xl border-4 border-white bg-red-100 text-lg font-extrabold text-red-700 dark:border-slate-900 dark:bg-red-950/60">
                      {`${mentor.user?.firstName?.[0] || ''}${mentor.user?.lastName?.[0] || ''}`}
                    </span>
                  )}
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {mentor.user?.firstName} {mentor.user?.lastName}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {mentor.headline}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(mentor.skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="badge-info !text-[10px]">{skill}</span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs">
                  <span className={mentor.isPublished ? 'badge-success' : 'badge-neutral'}>
                    {mentor.isPublished ? 'Published' : 'Hidden'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <BookOpenIcon /> {mentor.courseCount || 0} courses
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button type="button" onClick={() => openEdit(mentor)} className="btn-secondary !py-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" /> Edit profile
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(mentor)}
                    className={`btn-secondary !py-1.5 text-xs ${
                      mentor.isFeatured ? '!text-amber-600' : ''
                    }`}
                  >
                    <Star className={`h-3.5 w-3.5 ${mentor.isFeatured ? 'fill-amber-400' : ''}`} />
                    {mentor.isFeatured ? 'Unfeature' : 'Feature'}
                  </button>
                  <Link to={`/mentors/${mentor.userId}`} className="btn-secondary !py-1.5 text-xs">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Edit ${editing.user?.firstName || 'mentor'}` : 'Edit mentor'}
        description="These details appear on the public mentor banner and in social previews."
        wide
      >
        {formError && <ErrorBox message={formError} />}
        <form onSubmit={save} className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
            {form.bannerImage ? (
              <img src={normalizeImageUrl(form.bannerImage)} alt="" className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Award className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Banner / profile image</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Used as the social preview image. JPG, PNG or WebP · max 4MB.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="btn-secondary !py-1.5 text-xs">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  {uploading ? 'Uploading…' : 'Upload image'}
                  <input type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                </label>
                {form.bannerImage && (
                  <button type="button" onClick={() => setForm((prev) => ({ ...prev, bannerImage: '' }))} className="btn-secondary !py-1.5 text-xs">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="mentor-headline-admin" className="label">Headline</label>
            <input id="mentor-headline-admin" required value={form.headline} onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label htmlFor="mentor-bio-admin" className="label">Bio</label>
            <textarea id="mentor-bio-admin" rows={3} value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} className="input-field" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="mentor-quals-admin" className="label">Qualifications (comma separated)</label>
              <input id="mentor-quals-admin" value={form.qualifications} onChange={(e) => setForm((p) => ({ ...p, qualifications: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label htmlFor="mentor-skills-admin" className="label">Skills (comma separated)</label>
              <input id="mentor-skills-admin" value={form.skills} onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label htmlFor="mentor-years-admin" className="label">Years of experience</label>
              <input id="mentor-years-admin" type="number" min="0" value={form.yearsExperience} onChange={(e) => setForm((p) => ({ ...p, yearsExperience: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label htmlFor="mentor-website-admin" className="label">Website</label>
              <input id="mentor-website-admin" value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label htmlFor="mentor-linkedin-admin" className="label">LinkedIn</label>
              <input id="mentor-linkedin-admin" value={form.linkedin} onChange={(e) => setForm((p) => ({ ...p, linkedin: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label htmlFor="mentor-twitter-admin" className="label">X / Twitter</label>
              <input id="mentor-twitter-admin" value={form.twitter} onChange={(e) => setForm((p) => ({ ...p, twitter: e.target.value }))} className="input-field" />
            </div>
          </div>

          <div className="space-y-2">
            <Toggle label="Published on the public mentors page" checked={form.isPublished} onChange={(v) => setForm((p) => ({ ...p, isPublished: v }))} />
            <Toggle label="Featured on the homepage" checked={form.isFeatured} onChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Save mentor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const BookOpenIcon = () => <BookOpen className="h-3.5 w-3.5" />;

export default AdminMentors;
