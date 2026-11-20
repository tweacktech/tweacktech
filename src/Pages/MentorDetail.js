import React, { useEffect, useState } from 'react';
import { normalizeImageUrl } from '../lib/image';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Clock,
  Facebook,
  Globe,
  GraduationCap,
  Linkedin,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  Twitter,
  Users,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { mentorShareLinks, mentorShareText, copyText } from '../lib/share';
import { useSeo } from '../Component/useSeo';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const money = (amount, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency || 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);

const MentorDetail = () => {
  const { id } = useParams();
  const { api } = useAuth();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get(`/mentors/${id}`)
      .then((res) => {
        if (!cancelled) setMentor(unwrap(res));
      })
      .catch(() => {
        if (!cancelled) setError('We could not find that mentor profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  const mentorName = mentor?.user
    ? `${mentor.user.firstName} ${mentor.user.lastName}`
    : 'TweackTech Mentor';
  useSeo({
    title: `${mentorName} — ${mentor?.headline || 'Tech Mentor'}`,
    description:
      mentor?.bio ||
      `${mentorName} is a verified tech mentor at TweackTech. View qualifications, skills, courses and share this profile.`,
    image:
      mentor?.bannerImage ||
      mentor?.user?.avatar ||
      mentor?.user?.courses?.[0]?.thumbnail ||
      '/icon-512.png',
    url: `/mentors/${mentor?.userId || id}`,
    type: 'profile',
    author: `${mentorName} · Meyor Dari`,
    section: 'Mentor profile',
    keywords: `${(mentor?.skills || []).join(', ')}, ${mentorName}, tech mentor, TweackTech`,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page py-16">
          <div className="skeleton h-64 w-full rounded-3xl" />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="skeleton h-40 rounded-2xl lg:col-span-2" />
            <div className="skeleton h-40 rounded-2xl" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !mentor?.user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page flex flex-col items-center gap-4 py-24 text-center">
          <Users className="h-10 w-10 text-slate-400" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mentor not found</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {error || 'This profile may have been unpublished.'}
          </p>
          <Link to="/mentors" className="btn-primary">
            <ArrowLeft className="h-4 w-4" /> Back to mentors
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const user = mentor.user;
  const courses = user.courses || [];
  const { links, url } = mentorShareLinks(mentor);
  const shareCopy = `${mentorShareText(mentor)} ${url}`;
  const socials = [
    { href: user.linkedin || mentor.linkedin, label: 'LinkedIn', Icon: Linkedin },
    { href: user.twitter || mentor.twitter, label: 'X', Icon: Twitter },
    { href: user.website || mentor.website, label: 'Website', Icon: Globe },
  ].filter((item) => item.href);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />

      <section className="relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-red-600/30 blur-3xl" />
          <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
        </div>
        <div className="container-page relative py-10 sm:py-14">
          <Link
            to="/mentors"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" /> All mentors
          </Link>

          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
            {user.avatar ? (
              <img
                src={normalizeImageUrl(user.avatar)}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-28 w-28 rounded-3xl border-4 border-white/20 object-cover shadow-2xl sm:h-36 sm:w-36"
              />
            ) : (
              <span className="grid h-28 w-28 place-items-center rounded-3xl border-4 border-white/20 bg-gradient-to-br from-red-500 to-red-800 text-3xl font-extrabold text-white shadow-2xl sm:h-36 sm:w-36">
                {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified mentor
                </span>
                {mentor.isFeatured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    <Award className="h-3.5 w-3.5" /> Featured
                  </span>
                )}
              </div>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {user.firstName} {user.lastName}
              </h1>
              <p className="mt-1 text-base font-semibold text-red-300">{mentor.headline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-300">
                {mentor.yearsExperience ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5" /> {mentor.yearsExperience}+ years experience
                  </span>
                ) : null}
                {(user.location || mentor.location) && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {user.location || mentor.location}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> {courses.length} published course
                  {courses.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/15"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-6 py-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">About {user.firstName}</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {mentor.bio || user.bio || 'This mentor has not added a bio yet.'}
            </p>
          </section>

          {mentor.qualifications?.length > 0 && (
            <section className="card p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <GraduationCap className="h-5 w-5 text-red-600" /> Qualifications & credentials
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {mentor.qualifications.map((qualification) => (
                  <li
                    key={qualification}
                    className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-200"
                  >
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {qualification}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mentor.skills?.length > 0 && (
            <section className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Skills & specialisms</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {mentor.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                <BookOpen className="h-5 w-5 text-red-600" /> Courses by {user.firstName}
              </h2>
              <Link to="/courses" className="text-xs font-semibold text-red-600 dark:text-red-400">
                All courses
              </Link>
            </div>
            {courses.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800/50 sm:px-6"
                  >
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt=""
                        className="h-16 w-24 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="grid h-16 w-24 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                        <BookOpen className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {course.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {course.shortDescription}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{course.level}</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {course.duration}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {course._count?.enrollments || 0} learners
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {course.type === 'FREE' ? 'Free' : money(course.price, course.currency)}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                        View <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                New courses from {user.firstName} are coming soon.
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card overflow-hidden">
            <div className="bg-gradient-to-br from-red-600 to-red-800 px-5 py-4 text-white">
              <h2 className="flex items-center gap-2 text-sm font-bold">
                <Share2 className="h-4 w-4" /> Share this mentor
              </h2>
              <p className="mt-1 text-xs text-red-100">
                Help a friend discover {user.firstName}&apos;s courses and skills.
              </p>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2">
                {links.map((link) => {
                  const icons = {
                    whatsapp: MessageCircle,
                    x: Twitter,
                    linkedin: Linkedin,
                    facebook: Facebook,
                    telegram: Send,
                  };
                  const Icon = icons[link.id] || Share2;
                  return (
                    <a
                      key={link.id}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-3 text-[11px] font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-red-800"
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </a>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(shareCopy);
                  if (ok) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1800);
                  }
                }}
                className="btn-secondary mt-3 w-full !py-2 text-xs"
              >
                {copied ? 'Copied share message' : 'Copy share message'}
              </button>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                &ldquo;{mentorShareText(mentor)}&rdquo;
              </p>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Ready to start?
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Create a free TweackTech account and enrol in one of {user.firstName}&apos;s courses.
            </p>
            <Link to="/register" className="btn-primary mt-4 w-full">
              Create free account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/courses" className="btn-secondary mt-2 w-full">
              Browse courses
            </Link>
          </section>
        </aside>
      </div>

      <Footer />
    </div>
  );
};

export default MentorDetail;
