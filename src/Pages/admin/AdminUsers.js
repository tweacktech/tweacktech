import React, { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeImageUrl } from '../../lib/image';
import {
  Camera,
  Check,
  Copy,
  KeyRound,
  Loader2,
  Pencil,
  Mail,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserX,
} from 'lucide-react';
import { useAuth } from '../../AuthContext';
import {
  EmptyState,
  ErrorBox,
  Loading,
  Modal,
  PageHeader,
  Pagination,
  Toggle,
  formatDate,
} from '../../Component/admin/AdminUI';
import { ADMIN_PAGES } from '../../lib/permissions';
import { getErrorMessage } from '../../lib/apiError';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const ALL_PERMISSIONS = [
  ['MANAGE_USERS', 'Manage users & roles'],
  ['MANAGE_COURSES', 'Manage courses'],
  ['MANAGE_STUDENTS', 'Manage students'],
  ['MANAGE_BLOG', 'Manage blog'],
  ['MANAGE_JOBS', 'Manage jobs'],
  ['MANAGE_SUPPORT', 'Manage support'],
  ['MANAGE_PAYMENTS', 'Approve payments'],
  ['MANAGE_TALENT', 'Manage Talent Hub'],
  ['MANAGE_CHAT', 'Manage chats'],
  ['MANAGE_CERTIFICATES', 'Manage certificates'],
  ['GRADE_ASSIGNMENTS', 'Grade assignments'],
  ['MANAGE_SETTINGS', 'Manage settings & currencies'],
];

const roleBadge = (role) => {
  if (role === 'SUPERADMIN') return 'badge-danger';
  if (role === 'ADMIN') return 'badge-warning';
  if (role === 'STAFF') return 'badge-info';
  return 'badge-neutral';
};

const EMPTY_FORM = { firstName: '', lastName: '', email: '', role: 'STUDENT', phone: '' };

const AdminUsers = () => {
  const { api, user, refreshUser, isSuperAdmin, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [editNotice, setEditNotice] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);
  const editAvatarRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      const res = await api.get(`/users?${params.toString()}`);
      const data = unwrap(res);
      setUsers(data?.users || []);
      setMeta(data?.meta || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  }, [api, page, search, role]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const openEdit = (target) => {
    setEditForm({
      id: target.id,
      firstName: target.firstName || '',
      lastName: target.lastName || '',
      email: target.email || '',
      role: target.role,
      phone: target.phone || '',
      bio: target.bio || '',
      location: target.location || '',
      avatar: target.avatar || '',
      permissions: target.permissions || [],
    });
    setEditError('');
    setEditNotice('');
    setEditOpen(true);
  };

  const uploadEditAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setEditError('');
    if (!file.type.startsWith('image/')) {
      setEditError('Please choose a JPG, PNG or WebP image.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setEditError('Profile photos must be 4MB or smaller.');
      return;
    }
    setAvatarBusy(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('folder', 'avatars');
      const uploaded = unwrap(await api.post('/media/upload', payload));
      if (!uploaded?.url) throw new Error('Upload failed');
      setEditForm((prev) => ({ ...prev, avatar: uploaded.url }));
      setEditNotice('Photo uploaded — save the form to apply it.');
    } catch (err) {
      setEditError(getErrorMessage(err, 'Unable to upload that photo.'));
    } finally {
      setAvatarBusy(false);
    }
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!editForm) return;
    setEditSaving(true);
    setEditError('');
    setEditNotice('');
    try {
      const payload = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        email: editForm.email,
        phone: editForm.phone,
        bio: editForm.bio,
        location: editForm.location,
        avatar: editForm.avatar,
        role: editForm.role,
        permissions: editForm.permissions,
      };
      const updated = unwrap(await api.patch(`/users/${editForm.id}/profile`, payload));
      setUsers((prev) => prev.map((item) => (item.id === editForm.id ? { ...item, ...updated } : item)));
      if (user?.id === editForm.id) await refreshUser();
      setEditNotice('User updated successfully.');
      setEditOpen(false);
      load();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Unable to update that user.');
    } finally {
      setEditSaving(false);
    }
  };

  const changeRole = async (userId, nextRole) => {
    try {
      const res = await api.patch(`/users/${userId}/role`, { role: nextRole });
      const updated = unwrap(res);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role: updated?.role || nextRole, permissions: updated?.permissions ?? u.permissions }
            : u,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update role.');
    }
  };

  const toggleActive = async (target) => {
    const reason = !target.isActive
      ? undefined
      : window.prompt(
          `Disable ${target.firstName} ${target.lastName}?\n\nOptional reason (sent to the user):`,
          'Disabled by an administrator',
        );
    if (target.isActive && reason === null) return;
    try {
      const res = await api.patch(`/users/${target.id}/toggle-active`, { reason });
      const updated = unwrap(res);
      setUsers((prev) =>
        prev.map((u) => (u.id === target.id ? { ...u, isActive: updated.isActive } : u))
      );
      if (!updated.isActive) {
        setError('');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.');
    }
  };

  const openPermissions = (u) => {
    setEditing(u);
    setSelectedPermissions(u.permissions || []);
  };

  const savePermissions = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await api.patch(`/users/${editing.id}/permissions`, {
        permissions: selectedPermissions,
      });
      const updated = unwrap(res);
      setUsers((prev) => prev.map((u) => (u.id === editing.id ? { ...u, ...updated } : u)));
      setEditing(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update permissions.');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError('');
    setCreated(null);
    setCopied(false);
    setCreateOpen(true);
  };

  const closeCreate = () => {
    setCreateOpen(false);
    setCreating(false);
    setFormError('');
    setCreated(null);
    setCopied(false);
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    setCreating(true);
    setFormError('');
    try {
      const res = await api.post('/users', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        role: form.role,
        phone: form.phone.trim() || undefined,
      });
      const data = unwrap(res);
      setCreated(data);
      if (page !== 1) setPage(1);
      else load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to create this account.');
    } finally {
      setCreating(false);
    }
  };

  const copyPassword = async () => {
    const password = created?.temporaryPassword;
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      setCopied(false);
    }
  };

  const canManageUsers = isSuperAdmin || hasPermission?.('MANAGE_USERS');

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Users & roles"
        description="Superadmins can change roles and grant section-level capabilities to admins and staff."
        actions={
          canManageUsers ? (
            <button type="button" onClick={openCreate} className="btn-primary">
              <UserPlus className="h-4 w-4" />
              Add user
            </button>
          ) : null
        }
      />

      {!editOpen && editNotice && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {editNotice}
        </p>
      )}

      <ErrorBox message={error} />

      <div className="card p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="input-field pl-10"
              placeholder="Search by name or email…"
            />
          </div>
          <select
            value={role}
            onChange={(e) => {
              setPage(1);
              setRole(e.target.value);
            }}
            className="input-field sm:w-48"
          >
            <option value="">All roles</option>
            <option value="SUPERADMIN">Superadmin</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="STUDENT">Student</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Loading label="Loading users…" />
      ) : users.length === 0 ? (
        <EmptyState icon={UserCog} title="No users found" description="Try a different search or role filter." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-shell min-w-[800px]">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <img src={normalizeImageUrl(u.avatar)} alt="" className="h-9 w-9 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold">
                            {`${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      {isSuperAdmin ? (
                        <select
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value)}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs font-semibold"
                        >
                          <option value="STUDENT">STUDENT</option>
                          <option value="STAFF">STAFF</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPERADMIN">SUPERADMIN</option>
                        </select>
                      ) : (
                        <span className={roleBadge(u.role)}>{u.role}</span>
                      )}
                    </td>
                    <td>
                      <div className="flex max-w-[220px] flex-wrap gap-1">
                        {(u.permissions || []).length === 0 && (
                          <span className="text-xs text-slate-400">None</span>
                        )}
                        {(u.permissions || []).slice(0, 3).map((p) => (
                          <span key={p} className="badge-info !text-[10px]">
                            {p.replace('MANAGE_', '').replace('_', ' ')}
                          </span>
                        ))}
                        {(u.permissions || []).length > 3 && (
                          <span className="badge-neutral !text-[10px]">
                            +{u.permissions.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={u.isActive ? 'badge-success' : 'badge-danger'}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(u.createdAt)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="btn-secondary !px-2.5 !py-1.5"
                            title="Edit user"
                            aria-label={`Edit ${u.firstName} ${u.lastName}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => openPermissions(u)}
                            className="btn-secondary !px-2.5 !py-1.5"
                            title="Manage permissions"
                          >
                            <Shield className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggleActive(u)}
                          className="btn-secondary !px-2.5 !py-1.5"
                          title={u.isActive ? 'Disable account' : 'Enable account'}
                        >
                          {u.isActive ? <UserX className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination meta={meta} onPage={setPage} />
          </div>
        </div>
      )}

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={editForm ? `Edit ${editForm.firstName} ${editForm.lastName}` : 'Edit user'}
        description="Update account details, role, capabilities and profile photo."
        wide
      >
        {editError && <ErrorBox message={editError} />}
        {editNotice && (
          <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
            {editNotice}
          </p>
        )}
        {editForm && (
          <form onSubmit={saveEdit} className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              {editForm.avatar ? (
                <img src={normalizeImageUrl(editForm.avatar)} alt="" className="h-14 w-14 rounded-xl object-cover" />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {`${editForm.firstName?.[0] || ''}${editForm.lastName?.[0] || ''}`}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Profile photo</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  JPG, PNG or WebP · max 4MB · visible across TweackTech
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => editAvatarRef.current?.click()}
                    disabled={avatarBusy}
                    className="btn-secondary !py-1.5 text-xs"
                  >
                    {avatarBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    {avatarBusy ? 'Uploading…' : 'Upload new photo'}
                  </button>
                  {editForm.avatar && (
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, avatar: '' }))}
                      className="btn-secondary !py-1.5 text-xs"
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={editAvatarRef}
                    type="file"
                    accept="image/*"
                    onChange={uploadEditAvatar}
                    className="hidden"
                    aria-label="Choose new profile photo"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="edit-first" className="label">First name</label>
                <input id="edit-first" required value={editForm.firstName} onChange={(e) => setEditForm((prev) => ({ ...prev, firstName: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label htmlFor="edit-last" className="label">Last name</label>
                <input id="edit-last" required value={editForm.lastName} onChange={(e) => setEditForm((prev) => ({ ...prev, lastName: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label htmlFor="edit-email" className="label">Email</label>
                <input id="edit-email" required type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label htmlFor="edit-role" className="label">Role</label>
                <select id="edit-role" value={editForm.role} onChange={(e) => setEditForm((prev) => ({ ...prev, role: e.target.value }))} className="input-field">
                  <option value="STUDENT">STUDENT</option>
                  <option value="STAFF">STAFF</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-phone" className="label">Phone</label>
                <input id="edit-phone" value={editForm.phone} onChange={(e) => setEditForm((prev) => ({ ...prev, phone: e.target.value }))} className="input-field" placeholder="+234…" />
              </div>
              <div>
                <label htmlFor="edit-location" className="label">Location</label>
                <input id="edit-location" value={editForm.location} onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))} className="input-field" placeholder="Lagos, Nigeria" />
              </div>
            </div>

            <div>
              <label htmlFor="edit-bio" className="label">Bio</label>
              <textarea id="edit-bio" rows={3} value={editForm.bio} onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))} className="input-field" />
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Capabilities</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ALL_PERMISSIONS.map(([value, label]) => (
                  <Toggle
                    key={value}
                    label={label}
                    checked={editForm.permissions.includes(value)}
                    onChange={(checked) =>
                      setEditForm((prev) => ({
                        ...prev,
                        permissions: checked
                          ? [...new Set([...prev.permissions, value])]
                          : prev.permissions.filter((item) => item !== value),
                      }))
                    }
                  />
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                Students automatically have no admin capabilities, even if boxes are ticked.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={editSaving} className="btn-primary">
                {editSaving ? 'Saving…' : 'Save user'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Manage permissions"
        description={
          editing
            ? `Grant capabilities to ${editing.firstName} ${editing.lastName}. SUPERADMIN always has full access.`
            : ''
        }
      >
        <div className="space-y-3">
          {ALL_PERMISSIONS.map(([value, label]) => (
            <Toggle
              key={value}
              label={label}
              checked={selectedPermissions.includes(value)}
              onChange={(checked) =>
                setSelectedPermissions((prev) =>
                  checked ? [...new Set([...prev, value])] : prev.filter((p) => p !== value)
                )
              }
            />
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pages unlocked by these permissions
          </p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-300">
            {ADMIN_PAGES.filter(
              (page) => page.permission && selectedPermissions.includes(page.permission),
            ).map((page) => (
              <li key={page.path} className="font-mono">
                {page.path}
              </li>
            ))}
            {selectedPermissions.length === 0 && (
              <li className="text-slate-400">No admin pages — dashboard only.</li>
            )}
          </ul>
          <p className="mt-2 text-[11px] text-slate-400">
            Direct URL visits to pages outside these permissions are redirected by the route guard.
          </p>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setEditing(null)} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={savePermissions} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save permissions'}
          </button>
        </div>
      </Modal>

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title={created ? 'Account created' : 'Add a user'}
        description={
          created
            ? 'Share these sign-in details with the new user.'
            : 'We generate a secure temporary password and email it to the user automatically.'
        }
      >
        {created ? (
          <div className="space-y-5">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                <Check className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">
                  {created.user?.firstName} {created.user?.lastName}
                </p>
                <p className="truncate text-sm text-slate-600 dark:text-slate-300">
                  {created.user?.email}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  <Mail className="h-3.5 w-3.5" /> Welcome email sent with the temporary password
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Temporary password
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-base font-bold text-slate-900 dark:bg-slate-900 dark:text-white">
                  {created.temporaryPassword}
                </code>
                <button type="button" onClick={copyPassword} className="btn-secondary">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <KeyRound className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Keep this visible until the user signs in — it cannot be shown again. They can change it from
                Settings after logging in.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={openCreate} className="btn-secondary">
                Add another
              </button>
              <button type="button" onClick={closeCreate} className="btn-primary">
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submitCreate} className="space-y-4">
            {formError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300">
                {formError}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  First name
                </label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  className="input-field"
                  placeholder="Ada"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Last name
                </label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  className="input-field"
                  placeholder="Lovelace"
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                className="input-field"
                placeholder="name@company.com"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="input-field"
                >
                  <option value="STUDENT">Student</option>
                  <option value="STAFF">Staff</option>
                  {isSuperAdmin && <option value="ADMIN">Admin</option>}
                  {isSuperAdmin && <option value="SUPERADMIN">Superadmin</option>}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Phone <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="input-field"
                  placeholder="+234 800 000 0000"
                />
              </div>
            </div>

            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              The account is created immediately with a one-time password. Change roles and permissions from the
              table after creating it.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeCreate} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn-primary">
                {creating ? 'Creating…' : 'Create account & email password'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
