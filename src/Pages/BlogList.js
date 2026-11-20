import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, Newspaper, Search, Tag, User } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const readingTime = (content) => {
  const words = (content || '').replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const ArticleCard = ({ post, featured }) => (
  <Link
    to={`/blog/${post.slug}`}
    className={`card card-hover group flex flex-col overflow-hidden ${
      featured ? 'lg:col-span-2 lg:flex-row' : ''
    }`}
  >
    <div
      className={`relative overflow-hidden bg-slate-100 dark:bg-slate-800 ${
        featured ? 'h-52 lg:h-auto lg:w-1/2' : 'h-48'
      }`}
    >
      <img loading="lazy" decoding="async"
        src={
          post.featuredImage ||
          'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800&auto=format&fit=crop'
        }
        alt=""
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-600 backdrop-blur dark:bg-slate-900/90 dark:text-red-400">
        {post.category?.name || 'General'}
      </span>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <User className="h-3.5 w-3.5" />
          {post.author?.firstName} {post.author?.lastName}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {readingTime(post.content)} min read
        </span>
      </div>

      <h2 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
        {post.title}
      </h2>
      <p className="mt-2 line-clamp-3 flex-1 text-sm text-slate-600 dark:text-slate-400">
        {post.excerpt || (post.content || '').replace(/<[^>]*>/g, '').slice(0, 160)}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-slate-400">{formatDate(post.publishedAt || post.createdAt)}</span>
        <span className="font-semibold text-red-600 dark:text-red-400">Read more →</span>
      </div>
    </div>
  </Link>
);

const BlogList = () => {
  const { api } = useAuth();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '30' });
      if (search) params.set('search', search);
      if (categoryFilter !== 'all') params.set('categoryId', categoryFilter);

      const [postsRes, catsRes] = await Promise.all([
        api.get(`/blog?${params.toString()}`),
        api.get('/blog/categories'),
      ]);
      const postsPayload = unwrap(postsRes);
      setPosts(postsPayload?.posts || []);
      setCategories(unwrap(catsRes) || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load the blog right now.');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [api, search, categoryFilter]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const [featuredPost, ...rest] = useMemo(() => posts, [posts]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-page py-12">
          <span className="section-eyebrow">
            <Newspaper className="h-3.5 w-3.5" /> Blog &amp; news
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Insights for <span className="gradient-text">developers</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Tutorials, career advice, and product news from the TweackTech team.
          </p>

          <div className="mt-7 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search articles…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field md:w-56"
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card p-5">
                <div className="skeleton h-40 w-full" />
                <div className="skeleton mt-4 h-4 w-1/3" />
                <div className="skeleton mt-3 h-5 w-3/4" />
                <div className="skeleton mt-2 h-4 w-full" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <BookOpen className="h-6 w-6" />
            </span>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              No articles found
            </h2>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Try a different search term or category. New articles are published regularly.
            </p>
            {(search || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setCategoryFilter('all');
                }}
                className="btn-secondary mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ArticleCard post={featuredPost} featured />
            {rest.map((post) => (
              <ArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-12 rounded-2xl border border-slate-200 p-6 dark:border-slate-800">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Tag className="h-4 w-4" /> Browse by topic
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`badge ${
                  categoryFilter === 'all'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`badge ${
                    categoryFilter === cat.id
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogList;
