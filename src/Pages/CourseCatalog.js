import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Filter, Layers, Search, Sparkles, Users } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { useCurrency } from '../CurrencyContext';
import { effectivePrice, isDiscountActive } from '../lib/coursePrice';
import Pagination from '../Component/Pagination';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const TYPES = [
  { id: 'All', label: 'All types' },
  { id: 'FREE', label: 'Free' },
  { id: 'PAID', label: 'Paid' },
  { id: 'PARTIAL', label: 'Partial payment' },
];



const typeBadge = (type) => {
  if (type === 'FREE') return <span className="badge bg-emerald-700 text-white shadow-sm">Free</span>;
  if (type === 'PARTIAL') return <span className="badge bg-amber-400 text-amber-950 shadow-sm">Partial payment</span>;
  return <span className="badge bg-sky-700 text-white shadow-sm">Paid</span>;
};

const levelTone = (level) => {
  if (level === 'Beginner') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400';
  if (level === 'Advanced') return 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400';
  return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400';
};

const CourseCard = ({ course }) => {
  const { format } = useCurrency();
  return (
  <Link to={`/courses/${course.id}`} className="card card-hover group flex flex-col overflow-hidden">
    <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
      <img loading="lazy" decoding="async"
        src={
          course.thumbnail ||
          'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop'
        }
        alt={`${course.title} course cover`}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
        {typeBadge(course.type)}
        {course.isFeatured && (
          <span className="badge-warning">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}
      </div>
      {course.enrollmentLocked && (
        <span className="absolute left-3 top-11 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-amber-200 backdrop-blur">
          Enrolment closed
        </span>
      )}
      <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
        {course.type === 'FREE' ? (
          'Free'
        ) : course.price == null ? (
          'Contact us'
        ) : isDiscountActive(course) ? (
          <>
            <span className="text-white/60 line-through">
              {format(course.price, course.currency || 'USD')}
            </span>
            <span className="text-emerald-300">
              {format(effectivePrice(course), course.currency || 'USD')}
            </span>
          </>
        ) : (
          format(course.price, course.currency || 'USD')
        )}
      </span>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span className={`badge ${levelTone(course.level)}`}>{course.level}</span>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Users className="h-3.5 w-3.5" /> {course._count?.enrollments ?? 0}
        </span>
      </div>

      <h2 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
        {course.title}
      </h2>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
        {course.shortDescription || course.description}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" /> {course._count?.modules ?? 0} modules
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3.5 w-3.5" /> {course.duration || 'Self paced'}
        </span>
      </div>
    </div>
  </Link>
  );
};

const CourseCatalog = () => {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/courses/categories')
      .then((res) => {
        if (!cancelled) setCategories(unwrap(res) || []);
      })
      .catch(() => undefined);
    api
      .get('/blog/featured?limit=4')
      .then((res) => {
        if (!cancelled) setFeaturedPosts(unwrap(res) || []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '12' });
      if (searchQuery) params.set('search', searchQuery);
      if (selectedCategory !== 'All') params.set('categoryId', selectedCategory);
      if (selectedLevel !== 'All') params.set('level', selectedLevel);
      if (selectedType !== 'All') params.set('type', selectedType);

      const res = await api.get(`/courses?${params.toString()}`);
      const payload = unwrap(res);
      setCourses(payload?.data || []);
      setMeta(payload?.meta || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load courses.');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [api, searchQuery, selectedCategory, selectedLevel, selectedType, page]);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  const activeFilters = useMemo(
    () =>
      [
        selectedCategory !== 'All' && 'category',
        selectedLevel !== 'All' && 'level',
        selectedType !== 'All' && 'type',
        searchQuery && 'search',
      ].filter(Boolean).length,
    [selectedCategory, selectedLevel, selectedType, searchQuery]
  );

  const reset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedLevel('All');
    setSelectedType('All');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-page py-12">
          <span className="section-eyebrow">
            <BookOpen className="h-3.5 w-3.5" /> Course catalog
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Master in-demand <span className="gradient-text">tech skills</span>
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Expert-led courses with projects, assignments, and certificates. Learn at your own
            pace and prove what you can build.
          </p>

          <div className="mt-7 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search courses…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
                aria-label="Filter by category"
              >
                <option value="All">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="input-field"
                aria-label="Filter by level"
              >
                {LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level === 'All' ? 'All levels' : level}
                  </option>
                ))}
              </select>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="input-field"
                aria-label="Filter by price type"
              >
                {TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Filter className="h-4 w-4" />
            {loading ? 'Loading courses…' : `${courses.length} course${courses.length === 1 ? '' : 's'} found`}
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={reset}
                className="ml-1 font-semibold text-red-600 dark:text-red-400"
              >
                Clear filters
              </button>
            )}
          </p>
          <Link to="/assignments" className="hidden text-xs font-semibold text-red-600 dark:text-red-400 sm:block">
            Already enrolled? Go to assignments
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </div>
        )}

        {featuredPosts.length > 0 && activeFilters === 0 && (
          <section className="mb-8 rounded-2xl border border-red-200 bg-white p-5 dark:border-red-900/60 dark:bg-slate-900">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-red-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Start here: choose your path
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {featuredPosts.slice(0, 2).map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group flex gap-4 rounded-xl border border-slate-200 p-4 transition hover:border-red-300 hover:bg-red-50/60 dark:border-slate-700 dark:hover:border-red-800 dark:hover:bg-red-950/20"
                >
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-20 w-28 shrink-0 rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold text-slate-900 group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
                      {post.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                      {post.excerpt}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-red-600 dark:text-red-400">
                      Read the guide →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-44 w-full" />
                <div className="p-5">
                  <div className="skeleton h-4 w-1/3" />
                  <div className="skeleton mt-3 h-5 w-3/4" />
                  <div className="skeleton mt-2 h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              <BookOpen className="h-6 w-6" />
            </span>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">No courses found</h2>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Try adjusting your search or filters to see more results.
            </p>
            <button type="button" onClick={reset} className="btn-secondary mt-2">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        <div className="mt-12 rounded-2xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-8 text-center dark:border-red-900/50 dark:from-red-950/30 dark:to-slate-900">
          <Award className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" />
          <h2 className="mt-3 text-xl font-bold text-slate-900 dark:text-white">
            Not sure where to start?
          </h2>
          <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600 dark:text-slate-400">
            Create a free account and we will help you pick a track that matches your goals.
          </p>
          <Link to="/register" className="btn-primary mt-4">
            Create free account
          </Link>
        </div>
        <Pagination meta={meta} onPage={setPage} />

    </main>

      <Footer />
    </div>
  );
};

export default CourseCatalog;
