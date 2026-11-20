import React, { useEffect, useRef, useState } from 'react';
import { normalizeImageUrl } from '../lib/image';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  Copy,
  Github,
  Loader2,
  Share2,
  Trash2,
  Globe,
  Linkedin,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Twitter,
  User,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { getErrorMessage } from '../lib/apiError';
import { copyText } from '../lib/share';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const emptyForm = {
  phone: '',
  bio: '',
  location: '',
  website: '',
  github: '',
  linkedin: '',
  twitter: '',
  hourlyRate: '',
  availability: '',
};

const emptyPassword = { currentPassword: '', newPassword: '', confirmPassword: '' };

const emptyMentor = {
  headline: '',
  bio: '',
  qualifications: '',
  skills: '',
  yearsExperience: '',
  linkedin: '',
  twitter: '',
  website: '',
  isPublished: true,
};

const ProfilePage = () => {
  const { user, api, refreshUser, isStaff } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [passwords, setPasswords] = useState(emptyPassword);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');
  const [avatarNotice, setAvatarNotice] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [mentor, setMentor] = useState(emptyMentor);
  const [mentorSaving, setMentorSaving] = useState(false);
  const [mentorError, setMentorError] = useState('');
  const [mentorNotice, setMentorNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/auth/me')
      .then((res) => {
        if (cancelled) return;
        const profile = unwrap(res) || {};
        setForm({
          phone: profile.phone || '',
          bio: profile.bio || '',
          location: profile.location || '',
          website: profile.website || '',
          github: profile.github || '',
          linkedin: profile.linkedin || '',
          twitter: profile.twitter || '',
          hourlyRate: profile.hourlyRate ?? '',
          availability: profile.availability || '',
        });
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err, 'Unable to load your profile.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    if (!isStaff) return undefined;
    let cancelled = false;
    api
      .get('/mentors/me')
      .then((res) => {
        if (cancelled) return;
        const profile = unwrap(res);
        if (!profile) return;
        setMentor({
          headline: profile.headline || '',
          bio: profile.bio || '',
          qualifications: (profile.qualifications || []).join(', '),
          skills: (profile.skills || []).join(', '),
          yearsExperience: profile.yearsExperience ?? '',
          linkedin: profile.linkedin || '',
          twitter: profile.twitter || '',
          website: profile.website || '',
          isPublished: profile.isPublished !== false,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, isStaff]);

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarError('');
    setAvatarNotice('');
    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setAvatarError('Profile photos must be 4MB or smaller.');
      return;
    }
    setUploadingAvatar(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('folder', 'avatars');
      const uploaded = unwrap(await api.post('/media/upload', payload));
      if (!uploaded?.url) throw new Error('Upload failed');
      await api.patch('/users/profile/me', { avatar: uploaded.url });
      await refreshUser();
      setAvatarNotice('Profile photo updated.');
    } catch (err) {
      setAvatarError(getErrorMessage(err, 'Unable to upload your photo.'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarError('');
    setAvatarNotice('');
    setUploadingAvatar(true);
    try {
      await api.patch('/users/profile/me', { avatar: '' });
      await refreshUser();
      setAvatarNotice('Profile photo removed.');
    } catch (err) {
      setAvatarError(getErrorMessage(err, 'Unable to remove your photo.'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveMentor = async (event) => {
    event.preventDefault();
    setMentorError('');
    setMentorNotice('');
    if (!mentor.headline.trim()) {
      setMentorError('Add a short headline so learners know what you teach.');
      return;
    }
    setMentorSaving(true);
    try {
      await api.put('/mentors/me', mentor);
      setMentorNotice('Mentor profile saved. Your public profile is up to date.');
    } catch (err) {
      setMentorError(getErrorMessage(err, 'Unable to save your mentor profile.'));
    } finally {
      setMentorSaving(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.patch('/users/profile/me', form);
      await refreshUser();
      setSuccess('Profile updated.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update your profile.'));
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwords.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('The new passwords do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      await api.patch('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords(emptyPassword);
      setPasswordSuccess('Password changed successfully.');
    } catch (err) {
      setPasswordError(getErrorMessage(err, 'Unable to change your password.'));
    } finally {
      setChangingPassword(false);
    }
  };

  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}` || 'U';

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page max-w-5xl py-8">
        <Link
          to={user?.role === 'STAFF' ? '/dashboard' : '/dashboard'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400"
        >
          ← Back to dashboard
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          <aside className="space-y-4">
            <div className="card overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-red-600 to-red-900" />
              <div className="px-5 pb-5 text-center">
                <div className="relative -mt-10 mx-auto h-20 w-20">
                  {user?.avatar ? (
                    <img
                      src={normalizeImageUrl(user.avatar)}
                      alt="Your profile"
                      className="h-20 w-20 rounded-2xl border-4 border-white object-cover shadow-sm dark:border-slate-900"
                    />
                  ) : (
                    <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-slate-100 text-xl font-bold text-slate-600 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-300">
                      {initials}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-red-600 text-white shadow-md transition hover:bg-red-700 disabled:opacity-60 dark:border-slate-900"
                    aria-label="Upload profile photo"
                    title="Upload profile photo"
                  >
                    {uploadingAvatar ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    className="hidden"
                    aria-label="Choose profile photo"
                  />
                </div>
                <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  <span className="badge-info">{user?.role}</span>
                  {user?.isActive && <span className="badge-success">Active</span>}
                </div>
                {avatarError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">{avatarError}</p>
                )}
                {avatarNotice && (
                  <p className="mt-2 flex items-center justify-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {avatarNotice}
                  </p>
                )}
                {user?.avatar && (
                  <button
                    type="button"
                    onClick={removeAvatar}
                    disabled={uploadingAvatar}
                    className="mx-auto mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-red-600 disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> Remove photo
                  </button>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Protected details
              </h2>
              <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p className="flex items-start gap-2">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <span className="break-all">{user?.email}</span>
                </p>
                <p className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Email and your legal name are locked. Contact support if either needs to change.
                You can update your profile photo any time.
              </p>
            </div>
          </aside>

          <div className="space-y-6 lg:col-span-2">
            <section className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile details</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                These details appear on your instructor or Talent Hub profile where relevant.
              </p>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                </div>
              )}
              {success && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {success}
                </div>
              )}

              {loading ? (
                <div className="mt-5 space-y-3">
                  <div className="skeleton h-10 w-full" />
                  <div className="skeleton h-24 w-full" />
                  <div className="skeleton h-10 w-2/3" />
                </div>
              ) : (
                <form onSubmit={saveProfile} className="mt-5 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="label">Phone</label>
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input id="phone" value={form.phone} onChange={update('phone')} className="input-field pl-10" placeholder="+234…" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="location" className="label">Location</label>
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input id="location" value={form.location} onChange={update('location')} className="input-field pl-10" placeholder="Lagos, Nigeria" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="label">Bio</label>
                    <textarea id="bio" rows={4} value={form.bio} onChange={update('bio')} className="input-field" placeholder="Tell learners or employers about yourself…" />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="website" className="label">Website</label>
                      <div className="relative">
                        <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input id="website" value={form.website} onChange={update('website')} className="input-field pl-10" placeholder="https://…" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="github" className="label">GitHub</label>
                      <div className="relative">
                        <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input id="github" value={form.github} onChange={update('github')} className="input-field pl-10" placeholder="https://github.com/…" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="linkedin" className="label">LinkedIn</label>
                      <div className="relative">
                        <Linkedin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input id="linkedin" value={form.linkedin} onChange={update('linkedin')} className="input-field pl-10" placeholder="https://linkedin.com/in/…" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="twitter" className="label">X / Twitter</label>
                      <div className="relative">
                        <Twitter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input id="twitter" value={form.twitter} onChange={update('twitter')} className="input-field pl-10" placeholder="https://x.com/…" />
                      </div>
                    </div>
                  </div>

                  {isStaff && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="hourlyRate" className="label">Hourly rate (optional)</label>
                        <input id="hourlyRate" type="number" min="0" step="0.01" value={form.hourlyRate} onChange={update('hourlyRate')} className="input-field" />
                      </div>
                      <div>
                        <label htmlFor="availability" className="label">Availability</label>
                        <select id="availability" value={form.availability} onChange={update('availability')} className="input-field">
                          <option value="">Not set</option>
                          <option>Available</option>
                          <option>Busy</option>
                          <option>Open to offers</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button type="submit" disabled={saving} className="btn-primary">
                      <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save profile'}
                    </button>
                  </div>
                </form>
              )}
            </section>

            {isStaff && (
              <section className="card overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-red-800 px-6 py-5 text-white">
                  <h2 className="flex items-center gap-2 text-lg font-bold">
                    <BadgeCheck className="h-5 w-5 text-red-300" /> Mentor profile
                  </h2>
                  <p className="mt-1 text-xs text-slate-200">
                    This is the banner learners see across TweackTech. Add your qualifications and
                    skills, then share your public page to advertise your courses.
                  </p>
                </div>
                <div className="p-6">
                  {mentorNotice && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {mentorNotice}
                    </div>
                  )}
                  {mentorError && (
                    <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {mentorError}
                    </div>
                  )}

                  <form onSubmit={saveMentor} className="space-y-4">
                    <div>
                      <label htmlFor="mentor-headline" className="label">Headline</label>
                      <input
                        id="mentor-headline"
                        value={mentor.headline}
                        onChange={(event) => setMentor((prev) => ({ ...prev, headline: event.target.value }))}
                        className="input-field"
                        placeholder="Senior Frontend Engineer & React Instructor"
                        maxLength={140}
                      />
                    </div>
                    <div>
                      <label htmlFor="mentor-bio" className="label">About you</label>
                      <textarea
                        id="mentor-bio"
                        rows={4}
                        value={mentor.bio}
                        onChange={(event) => setMentor((prev) => ({ ...prev, bio: event.target.value }))}
                        className="input-field"
                        placeholder="What do you teach, and who will benefit from your courses?"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="mentor-qualifications" className="label">
                          Qualifications <span className="font-normal text-slate-400">(comma separated)</span>
                        </label>
                        <input
                          id="mentor-qualifications"
                          value={mentor.qualifications}
                          onChange={(event) => setMentor((prev) => ({ ...prev, qualifications: event.target.value }))}
                          className="input-field"
                          placeholder="BSc Computer Science, AWS Certified"
                        />
                      </div>
                      <div>
                        <label htmlFor="mentor-skills" className="label">
                          Skills <span className="font-normal text-slate-400">(comma separated)</span>
                        </label>
                        <input
                          id="mentor-skills"
                          value={mentor.skills}
                          onChange={(event) => setMentor((prev) => ({ ...prev, skills: event.target.value }))}
                          className="input-field"
                          placeholder="React, TypeScript, Node.js"
                        />
                      </div>
                      <div>
                        <label htmlFor="mentor-years" className="label">Years of experience</label>
                        <input
                          id="mentor-years"
                          type="number"
                          min="0"
                          max="60"
                          value={mentor.yearsExperience}
                          onChange={(event) => setMentor((prev) => ({ ...prev, yearsExperience: event.target.value }))}
                          className="input-field"
                          placeholder="8"
                        />
                      </div>
                      <div>
                        <label htmlFor="mentor-website" className="label">Website / portfolio</label>
                        <input
                          id="mentor-website"
                          value={mentor.website}
                          onChange={(event) => setMentor((prev) => ({ ...prev, website: event.target.value }))}
                          className="input-field"
                          placeholder="https://…"
                        />
                      </div>
                      <div>
                        <label htmlFor="mentor-linkedin" className="label">LinkedIn</label>
                        <input
                          id="mentor-linkedin"
                          value={mentor.linkedin}
                          onChange={(event) => setMentor((prev) => ({ ...prev, linkedin: event.target.value }))}
                          className="input-field"
                          placeholder="https://linkedin.com/in/…"
                        />
                      </div>
                      <div>
                        <label htmlFor="mentor-twitter" className="label">X / Twitter</label>
                        <input
                          id="mentor-twitter"
                          value={mentor.twitter}
                          onChange={(event) => setMentor((prev) => ({ ...prev, twitter: event.target.value }))}
                          className="input-field"
                          placeholder="https://x.com/…"
                        />
                      </div>
                    </div>

                    <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={mentor.isPublished}
                        onChange={(event) => setMentor((prev) => ({ ...prev, isPublished: event.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-red-600"
                      />
                      Publish this mentor profile so learners can find me
                    </label>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyText(`${window.location.origin}/mentors/${user?.id}`);
                          if (ok) {
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1800);
                          }
                        }}
                        className="btn-secondary !py-2 text-xs"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Link copied' : 'Copy public profile link'}
                      </button>
                      <button type="submit" disabled={mentorSaving} className="btn-primary">
                        <Save className="h-4 w-4" /> {mentorSaving ? 'Saving…' : 'Save mentor profile'}
                      </button>
                    </div>
                  </form>

                  <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Share2 className="h-3.5 w-3.5" />
                    Your public page is <span className="font-mono">/mentors/{user?.id}</span> — share it on
                    WhatsApp, X, LinkedIn or Facebook from that page.
                  </p>
                </div>
              </section>
            )}

            <section className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <Lock className="h-4 w-4 text-red-600" /> Change password
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Use at least 8 characters. You will stay signed in on this device.
              </p>

              {passwordError && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {passwordSuccess}
                </div>
              )}

              <form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="currentPassword" className="label">Current password</label>
                  <input id="currentPassword" type="password" required autoComplete="current-password" value={passwords.currentPassword} onChange={(event) => setPasswords((prev) => ({ ...prev, currentPassword: event.target.value }))} className="input-field" />
                </div>
                <div>
                  <label htmlFor="newPassword" className="label">New password</label>
                  <input id="newPassword" type="password" required autoComplete="new-password" value={passwords.newPassword} onChange={(event) => setPasswords((prev) => ({ ...prev, newPassword: event.target.value }))} className="input-field" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="label">Confirm new password</label>
                  <input id="confirmPassword" type="password" required autoComplete="new-password" value={passwords.confirmPassword} onChange={(event) => setPasswords((prev) => ({ ...prev, confirmPassword: event.target.value }))} className="input-field" />
                </div>
                <div className="sm:col-span-3 flex justify-end">
                  <button type="submit" disabled={changingPassword} className="btn-primary">
                    <Lock className="h-4 w-4" /> {changingPassword ? 'Changing…' : 'Change password'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
