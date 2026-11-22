import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Quote, Star } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { normalizeImageUrl } from '../lib/image';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

/** Public wall of approved student testimonies. Hidden entirely when empty. */
const TestimonialWall = ({ limit = 6, compact = false }) => {
  const { api } = useAuth();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/testimonials?limit=${limit}`)
      .then((res) => {
        if (!cancelled) setItems(unwrap(res) || []);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [api, limit]);

  if (!loaded || items.length === 0) return null;

  return (
    <div className={`grid gap-5 ${compact ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
      {items.map((item) => (
        <figure
          key={item.id}
          className="card flex h-full flex-col p-5 sm:p-6"
        >
          <Quote className="h-7 w-7 text-red-600/40 dark:text-red-400/40" />
          <div className="mt-3 flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= item.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            &ldquo;{item.content}&rdquo;
          </blockquote>
          <figcaption className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            {item.avatar ? (
              <img
                src={normalizeImageUrl(item.avatar)}
                alt=""
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                {item.name?.[0]?.toUpperCase() || 'S'}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900 dark:text-white">
                {item.name}
              </span>
              <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                {item.headline || item.course?.title || 'TweackTech learner'}
              </span>
            </span>
          </figcaption>
        </figure>
      ))}
      {!compact && (
        <div className="flex items-center justify-center">
          <Link to="/testimonials" className="btn-secondary inline-flex items-center gap-2">
            Read more stories <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default TestimonialWall;
