import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Github,
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

  const update = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

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
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    className="-mt-10 mx-auto h-20 w-20 rounded-2xl border-4 border-white object-cover dark:border-slate-900"
                  />
                ) : (
                  <span className="-mt-10 mx-auto grid h-20 w-20 place-items-center rounded-2xl border-4 border-white bg-slate-100 text-xl font-bold text-slate-600 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-300">
                    {initials}
                  </span>
                )}
                <h1 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.role}</p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  <span className="badge-info">{user?.role}</span>
                  {user?.isActive && <span className="badge-success">Active</span>}
                </div>
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
                Email, name and profile photo are locked. Contact support if any of these need
                to change.
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
