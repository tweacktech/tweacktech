import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Eye, Tag, User } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import ShareButtons from '../Component/ShareButtons';
import { useAuth } from '../AuthContext';
import { useSeo } from '../Component/useSeo';
import sanitizeHtml from '../lib/sanitizeHtml';
import { formatReadingStats } from '../lib/readingTime';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
};

const BlogDetail = () => {
  const { slug } = useParams();
  const { api } = useAuth();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useSeo({
    title: post?.title || 'Tech Blog',
    description:
      post?.excerpt ||
      'Read insights, tutorials and career advice from the TweackTech tech blog.',
    image: post?.featuredImage || '/icon-512.png',
    url: `/blog/${slug}`,
    type: 'article',
    author: post?.author
      ? `${post.author.firstName || ''} ${post.author.lastName || ''} · Meyor Dari`
      : 'Meyor Dari',
    section: 'Tech insights',
    publishedTime: post?.createdAt,
    keywords: `${post?.title || ''}, TweackTech blog, tech articles, Meyor Dari, programming tutorials`,
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/blog/slug/${slug}`);
        if (!cancelled) setPost(unwrap(res));
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.status === 404
              ? 'This article could not be found.'
              : err.response?.data?.message || 'Unable to load this article.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api, slug]);

  useEffect(() => {
    if (!post?.category?.id) return;
    let cancelled = false;
    api
      .get(`/blog?categoryId=${post.category.id}&limit=4`)
      .then((res) => {
        if (cancelled) return;
        const payload = unwrap(res);
        setRelated((payload?.posts || []).filter((item) => item.slug !== post.slug).slice(0, 3));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api, post]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page max-w-3xl py-10">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton mt-6 h-10 w-3/4" />
          <div className="skeleton mt-3 h-4 w-1/2" />
          <div className="skeleton mt-8 h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Article not found</h2>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {error || 'The article you are looking for may have been moved.'}
          </p>
          <Link to="/blog" className="btn-primary mt-2">
            <ArrowLeft className="h-4 w-4" /> Back to blog
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <main className="container-page max-w-3xl py-10">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to all articles
        </Link>

        <article className="mt-6">
          <span className="badge bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {post.category?.name || 'General'}
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-400">{post.excerpt}</p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-slate-200 py-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author?.firstName} {post.author?.lastName}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {formatReadingStats(post.content)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" /> {post.viewCount ?? 0} views
            </span>
            <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          </div>

          <ShareButtons
            className="mt-4"
            url={`/blog/${post.slug}`}
            title={post.title}
            description={post.excerpt || ''}
          />

          {post.featuredImage && (
            <img
              src={post.featuredImage}
              alt=""
              className="mt-6 h-auto w-full rounded-2xl object-cover"
            />
          )}

          <div
            className="prose prose-slate mt-8 max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-red-600 dark:prose-a:text-red-400"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
          />

          {post.tags && (
            <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-6 dark:border-slate-800">
              <Tag className="h-4 w-4 text-slate-400" />
              {post.tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
                .map((tag) => (
                  <span key={tag} className="badge-neutral">
                    {tag}
                  </span>
                ))}
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              More from {post.category?.name || 'the blog'}
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((item) => (
                <Link key={item.id} to={`/blog/${item.slug}`} className="card card-hover p-4">
                  <p className="line-clamp-2 text-sm font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default BlogDetail;
