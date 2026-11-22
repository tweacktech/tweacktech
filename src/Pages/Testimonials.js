import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Loader2, MessageSquareQuote, Send, Star } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import Breadcrumbs from '../Component/Breadcrumbs';
import TestimonialWall from '../Component/TestimonialWall';
import { useAuth } from '../AuthContext';
import { useSeo } from '../Component/useSeo';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const Testimonials = () => {
  const { api, isAuthenticated, user } = useAuth();
  const [content, setContent] = useState('');
  const [headline, setHeadline] = useState('');
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [mine, setMine] = useState([]);

  useSeo({
    title: 'Student Testimonials',
    description:
      'Read real stories from TweackTech learners and share your own experience learning tech skills with us.',
    url: '/testimonials',
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get('/testimonials/mine')
      .then((res) => setMine(unwrap(res) || []))
      .catch(() => undefined);
  }, [api, isAuthenticated]);

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    setMessage('');
    try {
      const res = await api.post('/testimonials', { content, headline, rating });
      const data = unwrap(res);
      if (data?.error) setError(data.error);
      else {
        setMessage(data?.message || 'Thank you! Your testimony will appear after review.');
        setContent('');
        setHeadline('');
        setRating(5);
        setMine((prev) => [data.testimonial, ...prev]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to submit your testimony right now.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />
      <div className="container-page py-8">
        <Breadcrumbs items={[{ label: 'Student stories' }]} className="mb-6" />

        <div className="max-w-2xl">
          <span className="section-eyebrow">
            <MessageSquareQuote className="h-3.5 w-3.5" /> Student voices
          </span>
          <h1 className="section-title mt-4">Stories from our learners</h1>
          <p className="section-subtitle">
            Every story is written by a real TweackTech student and published after review.
          </p>
        </div>

        <div className="mt-10">
          <TestimonialWall limit={30} />
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <section className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Share your experience</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tell other learners what changed for you. Your story is reviewed before it appears
              publicly.
            </p>

            {!isAuthenticated ? (
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm dark:border-slate-700 dark:bg-slate-800">
                <p className="text-slate-600 dark:text-slate-300">Sign in as a student to share your story.</p>
                <Link to="/login" className="btn-primary mt-4 inline-flex">Sign in</Link>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="testimony-content" className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Your testimony
                  </label>
                  <textarea
                    id="testimony-content"
                    required
                    minLength={10}
                    maxLength={1200}
                    rows={6}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="What did you learn, what did you build, and what changed for you?"
                    className="input-field mt-1"
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-400">{content.length}/1200</p>
                </div>
                <div>
                  <label htmlFor="testimony-headline" className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                    Your headline (optional)
                  </label>
                  <input
                    id="testimony-headline"
                    value={headline}
                    onChange={(event) => setHeadline(event.target.value)}
                    maxLength={120}
                    placeholder="e.g. Frontend developer, Lagos"
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-600 dark:text-slate-300">Your rating</span>
                  <div className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`${star} star${star === 1 ? '' : 's'}`}
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                {message && (
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> {message}
                  </p>
                )}
                <button type="submit" disabled={sending} className="btn-primary inline-flex items-center gap-2">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Sending…' : 'Submit my story'}
                </button>
              </form>
            )}
          </section>

          {isAuthenticated && (
            <section className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your submissions</h2>
              {mine.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">You haven&rsquo;t shared a story yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {mine.map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.course?.title || 'TweackTech'}
                        </span>
                        <span
                          className={`badge ${
                            item.isVisible
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          {item.isVisible ? 'Published' : 'Under review'}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs text-slate-600 dark:text-slate-300">{item.content}</p>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                Signed in as {user?.email}
              </p>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Testimonials;
