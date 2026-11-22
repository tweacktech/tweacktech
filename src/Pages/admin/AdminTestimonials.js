import React, { useCallback, useEffect, useState } from 'react';
import { Check, Eye, EyeOff, Loader2, MessageSquareQuote, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../AuthContext';
import { normalizeImageUrl } from '../../lib/image';
import { Loading, PageHeader } from '../../Component/admin/AdminUI';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const AdminTestimonials = () => {
  const { api } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/testimonials/all');
      setItems(unwrap(res) || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load testimonies.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const setVisibility = async (item, isVisible, isFeatured = item.isFeatured) => {
    setBusy(item.id);
    setError('');
    try {
      await api.patch(`/testimonials/${item.id}/visibility`, { isVisible, isFeatured });
      setItems((prev) =>
        prev.map((row) =>
          row.id === item.id ? { ...row, isVisible, isFeatured: isVisible ? isFeatured : false } : row,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update visibility.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete the testimony from ${item.name}? This cannot be undone.`)) return;
    setBusy(item.id);
    try {
      await api.delete(`/testimonials/${item.id}`);
      setItems((prev) => prev.filter((row) => row.id !== item.id));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete the testimony.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Loading label="Loading testimonies…" />;

  const visibleCount = items.filter((item) => item.isVisible).length;

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Student testimonies"
        description={`${items.length} submissions · ${visibleCount} visible on the site. Approve, feature or hide stories from here.`}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <MessageSquareQuote className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            No testimonies submitted yet. Students can share theirs on the testimonials page.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="card p-5">
              <div className="flex flex-wrap items-start gap-4">
                {item.avatar ? (
                  <img
                    src={normalizeImageUrl(item.avatar)}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-100 text-sm font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    {item.name?.[0]?.toUpperCase() || 'S'}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h2>
                    <span className={`badge ${item.isVisible ? 'badge-success' : 'badge-warning'}`}>
                      {item.isVisible ? 'Visible' : 'Hidden'}
                    </span>
                    {item.isFeatured && <span className="badge-info">Featured</span>}
                    <span className="inline-flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-3.5 w-3.5 ${
                            star <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.headline || 'TweackTech learner'}
                    {item.course?.title ? ` · ${item.course.title}` : ''} ·{' '}
                    {item.user?.email || ''} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {item.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {busy === item.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setVisibility(item, !item.isVisible)}
                        className={item.isVisible ? 'btn-secondary !py-1.5 text-xs' : 'btn-primary !py-1.5 text-xs'}
                        title={item.isVisible ? 'Hide from the site' : 'Show on the site'}
                      >
                        {item.isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        {item.isVisible ? 'Hide' : 'Show'}
                      </button>
                      {item.isVisible && (
                        <button
                          type="button"
                          onClick={() => setVisibility(item, true, !item.isFeatured)}
                          className="btn-secondary !py-1.5 text-xs"
                          title={item.isFeatured ? 'Remove featured status' : 'Feature this story'}
                        >
                          <Check className="h-3.5 w-3.5" />
                          {item.isFeatured ? 'Unfeature' : 'Feature'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:hover:bg-red-950/40"
                        title="Delete testimony"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminTestimonials;
