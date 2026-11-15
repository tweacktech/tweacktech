import React, { useCallback, useEffect, useState } from 'react';
import { Eye, Newspaper, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  formatDate,
} from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const emptyForm = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  categoryId: '',
  tags: '',
  isPublished: false,
  isFeatured: false,
};

const AdminBlog = () => {
  const { api } = useAuth();
  const [posts, setPosts] = useState([]);
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
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.set('search', search);
      const res = await api.get(`/blog/admin/all?${params.toString()}`);
      const data = unwrap(res);
      setPosts(data?.posts || []);
      setMeta(data?.meta || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load blog posts.');
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
      .get('/blog/categories')
      .then((res) => setCategories(unwrap(res) || []))
      .catch(() => setCategories([]));
  }, [api]);

  const update = (field) => (e) =>
    setForm((prev) => ({
      ...prev,
      [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || '' });
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditingId(post.id);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      featuredImage: post.featuredImage || '',
      categoryId: post.categoryId || '',
      tags: post.tags || '',
      isPublished: !!post.isPublished,
      isFeatured: !!post.isFeatured,
    });
    setModalOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingId) await api.put(`/blog/${editingId}`, form);
      else await api.post('/blog', form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save the post.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post) => {
    if (!window.confirm(`Delete “${post.title}”?`)) return;
    try {
      await api.delete(`/blog/${post.id}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete the post.');
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Blog & news"
        description="Publish announcements, tutorials, and career advice. Grant MANAGE_BLOG to let admins contribute."
        actions={
          <button type="button" onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" /> New post
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
            placeholder="Search posts…"
          />
        </div>
      </div>

      {loading ? (
        <Loading label="Loading posts…" />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title="No blog posts yet"
          description="Publish your first article to build an audience and support AdSense approval."
          action={
            <button type="button" onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" /> New post
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table-shell min-w-[760px]">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {post.featuredImage ? (
                          <img src={post.featuredImage} alt="" className="h-10 w-14 rounded-lg object-cover" />
                        ) : (
                          <span className="grid h-10 w-14 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400">
                            <Newspaper className="h-4 w-4" />
                          </span>
                        )}
                        <div className="max-w-xs">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">
                            {post.title}
                          </p>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            /{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">
                      {post.category?.name || '—'}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        <span className={post.isPublished ? 'badge-success' : 'badge-warning'}>
                          {post.isPublished ? 'Published' : 'Draft'}
                        </span>
                        {post.isFeatured && <span className="badge-info">Featured</span>}
                      </div>
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{post.viewCount ?? 0}</td>
                    <td className="text-xs text-slate-500 dark:text-slate-400">{formatDate(post.createdAt)}</td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/blog/${post.slug}`}
                          className="btn-secondary !px-2.5 !py-1.5"
                          title="View post"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(post)}
                          className="btn-secondary !px-2.5 !py-1.5"
                          title="Edit post"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(post)}
                          className="btn-ghost !px-2.5 !py-1.5 text-red-600 dark:text-red-400"
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
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
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit post' : 'New post'}
        wide
      >
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Title" htmlFor="post-title">
              <input id="post-title" required value={form.title} onChange={update('title')} className="input-field" />
            </Field>
            <Field label="Slug" htmlFor="post-slug" hint="Leave blank to auto-generate.">
              <input id="post-slug" value={form.slug} onChange={update('slug')} className="input-field" />
            </Field>
          </div>

          <Field label="Excerpt" htmlFor="post-excerpt">
            <textarea id="post-excerpt" rows={2} value={form.excerpt} onChange={update('excerpt')} className="input-field" />
          </Field>

          <Field label="Content (HTML supported)" htmlFor="post-content">
            <textarea id="post-content" required rows={9} value={form.content} onChange={update('content')} className="input-field font-mono text-xs" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Featured image URL" htmlFor="post-image">
              <input id="post-image" value={form.featuredImage} onChange={update('featuredImage')} className="input-field" placeholder="https://…" />
            </Field>
            <Field label="Category" htmlFor="post-category">
              <select id="post-category" value={form.categoryId} onChange={update('categoryId')} className="input-field">
                <option value="">No category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Tags" htmlFor="post-tags" hint="Comma separated">
            <input id="post-tags" value={form.tags} onChange={update('tags')} className="input-field" />
          </Field>

          <div className="flex flex-wrap gap-6 pt-1">
            <Toggle label="Published" checked={form.isPublished} onChange={(v) => setForm((p) => ({ ...p, isPublished: v }))} />
            <Toggle label="Featured" checked={form.isFeatured} onChange={(v) => setForm((p) => ({ ...p, isFeatured: v }))} />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish post'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminBlog;
