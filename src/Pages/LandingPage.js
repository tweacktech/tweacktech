import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  Briefcase,
  CheckCircle2,
  GraduationCap,
  Layers,
  Newspaper,
  PlayCircle,
  Share2,
  Sparkles,
  Terminal,
  Users,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import { useAuth } from '../AuthContext';
import { useCurrency } from '../CurrencyContext';
import { effectivePrice, isDiscountActive } from '../lib/coursePrice';
import MentorCard from '../Component/MentorCard';
import { useSeo } from '../Component/useSeo';
import TestimonialWall from '../Component/TestimonialWall';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);



const typeBadge = (type) => {
  if (type === 'FREE') return <span className="badge bg-emerald-700 text-white shadow-sm">Free</span>;
  if (type === 'PARTIAL') return <span className="badge bg-amber-400 text-amber-950 shadow-sm">Partial payment</span>;
  return <span className="badge bg-sky-700 text-white shadow-sm">Paid</span>;
};

const STATS = [
  { value: '10k+', label: 'Lessons completed' },
  { value: '8', label: 'Career tracks' },
  { value: '2k+', label: 'Developers hired' },
  { value: '500+', label: 'Hiring partners' },
];

const STEPS = [
  {
    icon: GraduationCap,
    title: 'Learn the fundamentals',
    body: 'Follow structured modules in React, Node.js, Python, Go, and more. Every course mixes video, slides, docs, and hands-on practice.',
  },
  {
    icon: Award,
    title: 'Prove what you can build',
    body: 'Submit assignments, get instructor feedback, and earn a verifiable certificate when you complete a course.',
  },
  {
    icon: Briefcase,
    title: 'Get hired with confidence',
    body: 'Publish a developer profile in the talent hub and apply to vetted roles from companies actively hiring engineers.',
  },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Project-based courses',
    body: 'Learn by shipping real work — not just watching videos. Each track ends with a portfolio-ready project.',
  },
  {
    icon: CheckCircle2,
    title: 'Assignments & feedback',
    body: 'Practise with graded tasks and detailed instructor notes so you always know what to improve next.',
  },
  {
    icon: Layers,
    title: 'Made for every pace',
    body: 'Free, paid, and partial-payment options. Study on your schedule and keep lifetime access to your courses.',
  },
  {
    icon: Users,
    title: 'A real talent network',
    body: 'Your progress and certificates feed a profile employers can discover when they search for skills.',
  },
];

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
        <span className="badge-neutral">{course.level || 'All levels'}</span>
        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Users className="h-3.5 w-3.5" /> {course._count?.enrollments ?? 0}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-red-600 dark:text-white dark:group-hover:text-red-400">
        {course.title}
      </h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
        {course.shortDescription || course.description}
      </p>
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" /> {course._count?.modules ?? 0} modules
        </span>
        <span className="font-semibold text-red-600 dark:text-red-400">View course →</span>
      </div>
    </div>
  </Link>
  );
};

const LandingPage = () => {
  const { api } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [mentors, setMentors] = useState([]);
  const [posts, setPosts] = useState([]);

  useSeo({
    title: 'Learn Tech Skills from Expert Mentors',
    description:
      'TweackTech is a tech learning platform and talent hub. Learn coding, design and DevOps from verified mentors, build real projects, earn certificates and get hired.',
    image: '/icon-512.png',
    url: '/',
    section: 'Technology education',
    keywords:
      'tech tweack, TweackTech online courses, learn programming, Meyor Dari, tech mentorship, developer career',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let res = await api.get('/courses?isFeatured=true&limit=3');
        let payload = unwrap(res);
        let list = payload?.data || [];
        if (list.length === 0) {
          res = await api.get('/courses?limit=3');
          payload = unwrap(res);
          list = payload?.data || [];
        }
        if (!cancelled) setCourses(list.slice(0, 3));
      } catch {
        if (!cancelled) setCourses([]);
      } finally {
        if (!cancelled) setLoadingCourses(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/blog?limit=3')
      .then((res) => {
        const payload = unwrap(res);
        const list = payload?.posts || payload?.data || [];
        if (!cancelled) setPosts(list.slice(0, 3));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/mentors/featured?limit=3')
      .then((res) => {
        const list = unwrap(res) || [];
        if (!cancelled) setMentors(list.slice(0, 3));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <Navbar />

      {/* Hero */}
      <header className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="absolute inset-0 bg-grid opacity-60 dark:opacity-30" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-orange-500/10 blur-3xl" />

        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="text-center lg:text-left">
              <span className="section-eyebrow">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                Learn, certify, get hired
              </span>

              <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                Master tech skills.
                <br />
                <span className="gradient-text">Get hired with proof.</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600 dark:text-slate-400 lg:mx-0">
                TweackTech combines a modern learning platform with a programmer talent hub.
                Build real projects, earn certificates, and connect with companies hiring
                developers.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/courses" className="btn-primary !px-6 !py-3 !text-base">
                  <PlayCircle className="h-5 w-5" /> Start learning
                </Link>
                <Link to="/talent" className="btn-secondary !px-6 !py-3 !text-base">
                  <Users className="h-5 w-5" /> Explore talent
                </Link>
                <Link to="/ide" className="btn-secondary !px-6 !py-3 !text-base">
                  <Terminal className="h-5 w-5" /> Try the free IDE
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400 lg:justify-start">
                {['Free courses to start', 'Certificate on completion', 'No credit card required'].map(
                  (item) => (
                    <span key={item} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-lg">
              <div className="glass-panel rounded-3xl p-5 shadow-2xl shadow-slate-900/10">
                <div className="relative overflow-hidden rounded-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                    srcSet="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=640&auto=format&fit=crop 640w, https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop 1200w"
                    sizes="(max-width: 1024px) 92vw, 520px"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    alt="Developers learning together"
                    className="h-56 w-full object-cover sm:h-64"
                  />
                  <span className="absolute left-3 top-3 badge bg-white/90 text-slate-800 backdrop-blur">
                    <GraduationCap className="h-3.5 w-3.5" /> Live cohort
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        React Mastery
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Module 3 of 4</p>
                    </div>
                    <span className="text-sm font-extrabold text-red-600 dark:text-red-400">
                      75%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div className="h-2 w-3/4 rounded-full bg-red-600" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Award className="h-4 w-4 text-amber-500" />
                    Certificate unlocked at 100%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-slate-200 pt-8 text-center dark:border-slate-800 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {stat.value}
                </dt>
                <dd className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* How it works */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> How it works
            </span>
            <h2 className="section-title mt-4">From first lesson to first offer</h2>
            <p className="section-subtitle">
              Three clear steps that turn study time into a credible, hireable profile.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3 stagger-children">
            {STEPS.map((step, index) => (
              <div key={step.title} className="card card-hover p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                    <step.icon className="h-6 w-6" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-4xl font-extrabold text-slate-500"
                  >
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free IDE */}
      <section className="py-6 sm:py-8">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-red-950 p-7 text-white shadow-xl sm:p-10">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-red-500/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-red-200">
                  <Terminal className="h-3.5 w-3.5" /> Free for everyone
                </span>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  Write and run code without signing up
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300 sm:text-base">
                  Our full-screen IDE runs JavaScript, TypeScript, Python, SQL, HTML and CSS
                  right in your browser. Pick a language, edit the example and see the output
                  instantly — no account, no payment, no setup.
                </p>
              </div>
              <Link to="/ide" className="btn-primary shrink-0 !bg-red-600 !px-6 !py-3 !text-base hover:!bg-red-500">
                <Terminal className="h-5 w-5" /> Open the free IDE <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Student testimonies */}
      <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <span className="section-eyebrow">
              <Sparkles className="h-3.5 w-3.5" /> Student stories
            </span>
            <h2 className="section-title mt-4">Learners who went further</h2>
            <p className="section-subtitle">
              Real stories from students who learned a skill, built a project and took the next step.
            </p>
          </div>
          <div className="mt-12">
            <TestimonialWall limit={6} />
          </div>
        </div>
      </section>

      {/* Featured courses */}
      <section className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900 sm:py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="section-eyebrow">
                <BookOpen className="h-3.5 w-3.5" /> Course catalog
              </span>
              <h2 className="section-title mt-4">Start with a featured course</h2>
              <p className="section-subtitle">
                Expert-led tracks with projects, assignments, and certificates.
              </p>
            </div>
            <Link to="/courses" className="btn-secondary shrink-0">
              View all courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loadingCourses
              ? [0, 1, 2].map((i) => (
                  <div key={i} className="card overflow-hidden">
                    <div className="skeleton h-44 w-full" />
                    <div className="p-5">
                      <div className="skeleton h-4 w-1/3" />
                      <div className="skeleton mt-3 h-5 w-3/4" />
                      <div className="skeleton mt-2 h-4 w-full" />
                    </div>
                  </div>
                ))
              : courses.map((course) => <CourseCard key={course.id} course={course} />)}
          </div>

          {!loadingCourses && courses.length === 0 && (
            <div className="card mt-10 flex flex-col items-center gap-3 p-10 text-center">
              <BookOpen className="h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                New courses are being published. Browse the catalog to see what is available.
              </p>
              <Link to="/courses" className="btn-primary mt-2">
                Browse courses
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Mentor banner */}
      <section className="relative overflow-hidden bg-slate-900 py-14 text-white sm:py-16">
        <div className="absolute inset-0">
          <div className="absolute -left-16 top-0 h-64 w-64 rounded-full bg-red-600/25 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]" />
        </div>
        <div className="container-page relative">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-red-200">
                <BadgeCheck className="h-3.5 w-3.5" /> Learn from the best
              </span>
              <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">
                Meet the mentors behind every course
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                Verified qualifications, real-world experience and a genuine interest in your
                growth. Explore their profiles, see the courses they teach, and share the ones
                that inspire you.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/mentors" className="btn-primary">
                <Users className="h-4 w-4" /> All mentors
              </Link>
              <Link
                to="/mentors"
                className="btn-secondary !border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
              >
                <Share2 className="h-4 w-4" /> Share a profile
              </Link>
            </div>
          </div>

          {mentors.length > 0 && (
            <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor) => (
                <div key={mentor.id} className="rounded-2xl bg-white dark:bg-slate-950">
                  <MentorCard mentor={mentor} featured={mentor.isFeatured} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-semibold text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Verified qualifications
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Real projects & feedback
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Shareable public profiles
            </span>
          </div>
        </div>
      </section>

      {/* Latest blog posts */}
      {posts.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-14 dark:border-slate-800 dark:bg-slate-900 sm:py-16">
          <div className="container-page">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="section-eyebrow">
                  <Newspaper className="h-3.5 w-3.5" /> From the blog
                </span>
                <h2 className="section-title mt-3">Fresh thinking in tech</h2>
                <p className="section-subtitle">
                  Practical guides, career advice and stories from the TweackTech community.
                </p>
              </div>
              <Link to="/blog" className="btn-secondary shrink-0">
                Read all articles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="card group overflow-hidden transition-transform duration-300 hover:-translate-y-1"
                >
                  {post.featuredImage ? (
                    <img loading="lazy" decoding="async"
                      src={post.featuredImage}
                      alt={post.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center bg-gradient-to-br from-red-600 to-red-900">
                      <Newspaper className="h-10 w-10 text-white/60" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.category?.name && (
                      <span className="badge-info !text-[10px]">{post.category.name}</span>
                    )}
                    <h3 className="mt-2 line-clamp-2 text-base font-bold text-slate-900 dark:text-white">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                      <span>
                        {post.createdAt
                          ? new Date(post.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : ''}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-red-600 dark:text-red-400">
                        Read <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feature grid */}
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <span className="section-eyebrow">
                <Award className="h-3.5 w-3.5" /> Why TweackTech
              </span>
              <h2 className="section-title mt-4">
                Built for people who want to <span className="gradient-text">ship</span>
              </h2>
              <p className="section-subtitle">
                Courses are only useful if they change what you can build. Everything here is
                designed around practical outcomes, honest feedback, and a clear path to work.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {['React', 'Node.js', 'TypeScript', 'Python', 'Go', 'DevOps', 'Data', 'UI/UX'].map(
                  (skill) => (
                    <span key={skill} className="badge-neutral">
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="card p-5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-red-600 dark:bg-slate-800 dark:text-red-400">
                    <feature.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {feature.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Talent CTA */}
      <section className="relative overflow-hidden bg-slate-900 py-16 dark:bg-slate-950 sm:py-20">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute -right-20 top-0 h-64 w-64 rounded-full bg-red-600/20 blur-3xl" />
        <div className="container-page relative text-center">
          <span className="section-eyebrow bg-white/10 text-red-300">
            <Briefcase className="h-3.5 w-3.5" /> For employers
          </span>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Hire developers who can show their work
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Browse profiles backed by completed courses, graded assignments, and verified
            certificates — then post a role and reach candidates directly.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/talent" className="btn-primary !px-6 !py-3 !text-base">
              <Users className="h-5 w-5" /> Explore talent
            </Link>
            <Link
              to="/jobs"
              className="btn !px-6 !py-3 !text-base border border-slate-700 text-white hover:bg-white/10"
            >
              <Briefcase className="h-5 w-5" /> Post a job
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
