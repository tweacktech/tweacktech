import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeImageUrl } from '../../lib/image';
import {
  BadgeCheck,
  Briefcase,
  MapPin,
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
  Toggle,
  formatMoney,
} from '../../Component/admin/AdminUI';
import { getErrorMessage } from '../../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const emptyForm = {
  userId: '',
  headline: '',
  bio: '',
  skills: '',
  experienceYears: '',
  hourlyRate: '',
  currency: 'USD',
  availability: 'Available',
  location: '',
  avatar: '',
  isPublished: true,
  isFeatured: false,
};

const AdminTalent = () => {
  const { api } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/talent/admin/all?limit=100');
      setProfiles(unwrap(res)?.profiles || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load Talent Hub profiles.'));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
    Promise.allSettled([
      api.get('/users?limit=100'),
      api.get('/users/instructors'),
    ]).then((results) => {
      const merged = new Map();
      results.forEach((result) => {
        if (result.status !== 'fulfilled') return;
        const payload = unwrap(result.value);
        const list = Array.isArray(payload) ? payload : payload?.users || [];
        list.forEach((person) => merged.set(person.id, person));
      });
      setUsers(Array.from(merged.values()));
    });
  }, [api, load]);

  const filtered = useMemo(
    () =>
      profiles.filter((profile) => {
        if (!search) return true;
        const haystack = `${profile.user?.firstName} ${profile.user?.lastName} ${profile.headline} ${(profile.skills || []).join(' ')}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      }),
    [profiles, search],
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, userId: users[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (profile) => {
    setEditing(profile);
    setForm({
      userId: profile.userId,
      headline: profile.headline || '',
      bio: profile.bio || '',
      skills: (profile.skills || []).join(', '),
      experienceYears: profile.experienceYears ?? '',
      hourlyRate: profile.hourlyRate ?? '',
      currency: profile.currency || 'USD',
      availability: profile.availability || 'Available',
      location: profile.location || '',
      avatar: profile.avatar || '',
      isPublished: !!profile.isPublished,
      isFeatured: !!profile.isFeatured,
    });
    setModalOpen(true);
  };

  const update = (field) => (event) =>
    setForm((prev) => ({
      ...prev,
      [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      ...form,
      skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears),
      hourlyRate: form.hourlyRate === '' ? null : Number(form.hourlyRate),
    };
    try {
      if (editing) await api.patch(`/talent/${editing.id}`, payload);
      else await api.post('/talent', payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save the profile.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (profile, field) => {
    try {
      await api.patch(`/talent/${profile.id}`, { [field]: !profile[field] });
      setProfiles((prev) =>
        prev.map((item) =>
          item.id === profile.id ? { ...item, [field]: !profile[field] } : item,
        ),
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update the profile.'));
    }
  };

  const remove = async (profile) => {
    if (
      !window.confirm(
        `Remove ${profile.user?.firstName} ${profile.user?.lastName} from the Talent Hub?`,
      )
    ) {
      return;
    }
    try {
      await api.delete(`/talent/${profile.id}`);
      load();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to remove the profile.'));
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Talent Hub"
        description="Publish vetted professionals, feature stand-out profiles and keep the directory current."
        actions={
          <button type="button" onClick={openCreate} disabled={users.length === 0} className="btn-primary">
            <Plus className="h-4 w-4" /> New profile
          </button>
        }
      />

      <ErrorBox message={error} />

      <div className="card p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="input-field pl-10"
            placeholder="Search by name, headline or skill…"
          />
        </div>
      </div>

      {loading ? (
        <Loading label="Loading talent profiles…" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No profiles yet"
          description="Add a profile for an instructor or professional to open the Talent Hub."
          action={
            users.length > 0 ? (
              <button type="button" onClick={openCreate} className="btn-primary">
                <Plus className="h-4 w-4" /> New profile
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((profile) => (
            <div key={profile.id} className="card overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-red-600 to-red-900" />
              <div className="px-5 pb-5">
                <div className="-mt-8 flex items-end justify-between">
                  {profile.avatar || profile.user?.avatar ? (
                    <img
                      src={normalizeImageUrl(profile.avatar || profile.user.avatar)}
                      alt=""
                      className="h-16 w-16 rounded-2xl border-4 border-white object-cover dark:border-slate-900"
                    />
                  ) : (
                    <span className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-white bg-slate-100 text-lg font-bold text-slate-500 dark:border-slate-900 dark:bg-slate-800">
                      {`${profile.user?.firstName?.[0] || ''}${profile.user?.lastName?.[0] || ''}`}
                    </span>
                  )}
                  <div className="flex gap-1">
                    <span className={profile.isPublished ? 'badge-success' : 'badge-warning'}>
                      {profile.isPublished ? 'Live' : 'Draft'}
                    </span>
                    {profile.isFeatured && <span className="badge-danger">Featured</span>}
                  </div>
                </div>
                <h3 className="mt-3 font-bold text-slate-900 dark:text-white">
                  {profile.user?.firstName} {profile.user?.lastName}
                </h3>
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{profile.headline}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(profile.skills || []).slice(0, 4).map((skill) => (
                    <span key={skill} className="badge-neutral !text-[10px]">{skill}</span>
                  ))}
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {profile.location && (
                    <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {profile.location}</p>
                  )}
                  {profile.hourlyRate && (
                    <p className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> {formatMoney(profile.hourlyRate, profile.currency)}/hr
                    </p>
                  )}
                  <p className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5" /> {profile.availability}</p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button type="button" onClick={() => openEdit(profile)} className="btn-secondary flex-1 !py-2">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(profile, 'isFeatured')}
                    className="btn-secondary !px-3 !py-2"
                    title="Feature on Talent Hub"
                  >
                    <Star className={`h-4 w-4 ${profile.isFeatured ? 'fill-amber-400 text-amber-400' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(profile, 'isPublished')}
                    className="btn-secondary !px-3 !py-2"
                    title={profile.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    <BadgeCheck className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(profile)}
                    className="btn-ghost !px-3 !py-2 text-red-600"
                    title="Delete profile"
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
        title={editing ? 'Edit talent profile' : 'New talent profile'}
        description="Profiles are public once published. Featured profiles appear first."
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          {!editing && (
            <Field label="User" htmlFor="talent-user" hint="The professional must already have an account.">
              <select id="talent-user" required value={form.userId} onChange={update('userId')} className="input-field">
                <option value="">Select a user…</option>
                {users.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.firstName} {person.lastName} · {person.email || person.role}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Headline" htmlFor="talent-headline">
            <input id="talent-headline" required value={form.headline} onChange={update('headline')} className="input-field" placeholder="Senior React Engineer" />
          </Field>
          <Field label="Bio" htmlFor="talent-bio">
            <textarea id="talent-bio" rows={4} value={form.bio} onChange={update('bio')} className="input-field" />
          </Field>
          <Field label="Skills" htmlFor="talent-skills" hint="Comma separated">
            <input id="talent-skills" value={form.skills} onChange={update('skills')} className="input-field" placeholder="React, TypeScript, Node.js" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Experience (years)" htmlFor="talent-exp">
              <input id="talent-exp" type="number" min="0" value={form.experienceYears} onChange={update('experienceYears')} className="input-field" />
            </Field>
            <Field label="Hourly rate" htmlFor="talent-rate">
              <input id="talent-rate" type="number" min="0" step="0.01" value={form.hourlyRate} onChange={update('hourlyRate')} className="input-field" />
            </Field>
            <Field label="Currency" htmlFor="talent-currency">
              <select id="talent-currency" value={form.currency} onChange={update('currency')} className="input-field">
                <option>USD</option><option>NGN</option><option>GHS</option><option>GBP</option><option>EUR</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Availability" htmlFor="talent-availability">
              <select id="talent-availability" value={form.availability} onChange={update('availability')} className="input-field">
                <option>Available</option>
                <option>Busy</option>
                <option>Open to offers</option>
              </select>
            </Field>
            <Field label="Location" htmlFor="talent-location">
              <input id="talent-location" value={form.location} onChange={update('location')} className="input-field" placeholder="Lagos, Nigeria" />
            </Field>
          </div>

          <Field label="Avatar URL" htmlFor="talent-avatar">
            <input id="talent-avatar" value={form.avatar} onChange={update('avatar')} className="input-field" placeholder="https://…" />
          </Field>

          <div className="flex flex-wrap gap-6 pt-1">
            <Toggle label="Published" checked={form.isPublished} onChange={(value) => setForm((prev) => ({ ...prev, isPublished: value }))} />
            <Toggle label="Featured" checked={form.isFeatured} onChange={(value) => setForm((prev) => ({ ...prev, isFeatured: value }))} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create profile'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminTalent;
