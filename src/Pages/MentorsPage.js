import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Search,
  Sparkles,
  Users,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import MentorCard from '../Component/MentorCard';
import { useAuth } from '../AuthContext';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const MentorsPage = () => {
  const { api } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [skill, setSkill] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/mentors?limit=60')
      .then((res) => {
        if (!cancelled) setMentors(unwrap(res) || []);
      })
      .catch(() => {
        if (!cancelled) setMentors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const skills = useMemo(() => {
    const set = new Set();
    mentors.forEach((mentor) => (mentor.skills || []).forEach((item) => set.add(item)));
    return [...set].slice(0, 14);
  }, [mentors]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return mentors.filter((mentor) => {
      const name = `${mentor.user?.firstName || ''} ${mentor.user?.lastName || ''}`.toLowerCase();
      const matchesTerm =
        !term ||
        name.includes(term) ||
        mentor.headline?.toLowerCase().includes(term) ||
        (mentor.skills || []).some((item) => item.toLowerCase().includes(term)) ||
        mentor.qualifications?.some((item) => item.toLowerCase().includes(term));
      const matchesSkill = !skill || (mentor.skills || []).includes(skill);
      return matchesTerm && matchesSkill;
    });
  }, [mentors, search, skill]);

  const hero = filtered[0] || mentors[0];

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />

      {/* Hero banner */}
      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-red-600/30 blur-3xl" />
          <div className="absolute -right-10 bottom-0 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:48px_48px]" />
        </div>
        <div className="container-page relative py-14 sm:py-20">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Meet your mentors
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Learn from people who
              <span className="block bg-gradient-to-r from-red-400 via-rose-300 to-amber-200 bg-clip-text text-transparent">
                build the real thing.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              Every TweackTech mentor is a working professional with verified qualifications,
              real projects and a track record of helping learners get hired. Explore their
              profiles and share them with a friend who is ready to level up.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/courses" className="btn-primary">
                <GraduationCap className="h-4 w-4" /> Browse courses
              </Link>
              <a href="#mentors" className="btn-secondary !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
                <Users className="h-4 w-4" /> View all mentors
              </a>
            </div>
          </div>

          {hero && (
            <div className="mt-10 grid gap-5 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur sm:grid-cols-[auto,1fr] sm:items-center sm:p-6">
              <div className="flex items-center gap-4">
                {hero.user?.avatar ? (
                  <img
                    src={hero.user.avatar}
                    alt=""
                    className="h-20 w-20 rounded-2xl border-2 border-white/30 object-cover sm:h-24 sm:w-24"
                  />
                ) : (
                  <span className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-red-500 to-red-800 text-2xl font-extrabold text-white sm:h-24 sm:w-24">
                    {`${hero.user?.firstName?.[0] || ''}${hero.user?.lastName?.[0] || ''}`}
                  </span>
                )}
                <div className="sm:hidden">
                  <p className="text-lg font-bold text-white">
                    {hero.user?.firstName} {hero.user?.lastName}
                  </p>
                  <p className="text-xs font-semibold text-red-300">{hero.headline}</p>
                </div>
              </div>
              <div>
                <div className="hidden sm:block">
                  <p className="text-lg font-bold text-white">
                    {hero.user?.firstName} {hero.user?.lastName}
                  </p>
                  <p className="text-sm font-semibold text-red-300">{hero.headline}</p>
                </div>
                {hero.qualifications?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {hero.qualifications.slice(0, 2).map((item) => (
                      <span key={item} className="flex items-center gap-1.5 text-xs text-slate-200">
                        <BadgeCheck className="h-3.5 w-3.5 text-emerald-400" /> {item}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <Link
                    to={`/mentors/${hero.userId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-white underline decoration-red-400 decoration-2 underline-offset-4"
                  >
                    View full profile <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                    <BookOpen className="h-3.5 w-3.5" /> {hero.courseCount || 0} course
                    {(hero.courseCount || 0) === 1 ? '' : 's'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mentor grid */}
      <section id="mentors" className="py-12 sm:py-16">
        <div className="container-page">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="section-eyebrow">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified experts
              </span>
              <h2 className="section-title mt-3">Mentors who make the difference</h2>
              <p className="section-subtitle">
                Browse qualifications, specialisms and the courses each mentor teaches.
              </p>
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search mentors or skills…"
                  className="input-field pl-10"
                  aria-label="Search mentors"
                />
              </div>
            </div>
          </div>

          {skills.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSkill('')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  !skill
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                }`}
              >
                All skills
              </button>
              {skills.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setSkill(item === skill ? '' : item)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    skill === item
                      ? 'bg-red-600 text-white'
                      : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="card overflow-hidden">
                  <div className="skeleton h-24 w-full" />
                  <div className="p-5">
                    <div className="skeleton h-14 w-14 rounded-2xl" />
                    <div className="skeleton mt-3 h-4 w-2/3" />
                    <div className="skeleton mt-2 h-3 w-1/2" />
                    <div className="skeleton mt-4 h-8 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((mentor) => (
                <MentorCard key={mentor.id} mentor={mentor} featured={mentor.isFeatured} />
              ))}
            </div>
          ) : (
            <div className="card mt-8 flex flex-col items-center gap-3 p-12 text-center">
              <Users className="h-9 w-9 text-slate-400" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                {mentors.length ? 'No mentors match that search' : 'Mentor profiles are coming soon'}
              </h3>
              <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
                {mentors.length
                  ? 'Try a different skill or clear the filters to see every mentor.'
                  : 'Our instructors are preparing their profiles. In the meantime, explore the course catalog.'}
              </p>
              <Link to="/courses" className="btn-primary mt-1">
                Browse courses
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="container-page flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-10 text-center text-white sm:px-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to learn from them?</h2>
          <p className="max-w-xl text-sm text-red-100 sm:text-base">
            Create a free account, enrol in a course, and get direct feedback from your mentor.
          </p>
          <Link to="/register" className="btn-primary !bg-white !text-red-700 hover:!bg-red-50">
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default MentorsPage;
