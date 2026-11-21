import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizeImageUrl } from '../lib/image';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  GraduationCap,
  Landmark,
  Layers,
  Loader2,
  Lock,
  PlayCircle,
  ShieldCheck,
  Upload,
  Users,
  X,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import Breadcrumbs from '../Component/Breadcrumbs';
import ShareButtons from '../Component/ShareButtons';
import { useAuth } from '../AuthContext';
import { useSeo } from '../Component/useSeo';
import { useCurrency } from '../CurrencyContext';
import { getErrorMessage } from '../lib/apiError';
import { effectivePrice, isDiscountActive } from '../lib/coursePrice';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

const safeParse = (value, fallback) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return typeof value === 'string' ? value.split('\n').filter(Boolean) : fallback;
  }
};

const typeLabel = (type) => {
  if (type === 'FREE') return 'Free course';
  if (type === 'PARTIAL') return 'Partial payment';
  return 'Paid course';
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const { api, user, isAuthenticated } = useAuth();
  const { selected, setCurrency, currencies, format, convert, formatIn } = useCurrency();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [courseAccess, setCourseAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollError, setEnrollError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [paymentCurrency, setPaymentCurrency] = useState(selected || 'NGN');
  const [existingPayment, setExistingPayment] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [proofNote, setProofNote] = useState('');
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  useSeo({
    title: course?.title || 'Tech Courses',
    description:
      course?.shortDescription ||
      course?.description?.slice(0, 180) ||
      'Learn in-demand tech skills with TweackTech courses, projects and certificates.',
    image: course?.thumbnail || '/icon-512.png',
    url: `/courses/${courseId}`,
    type: 'product',
    author: course?.instructor
      ? `${course.instructor.firstName} ${course.instructor.lastName} · Meyor Dari`
      : 'Meyor Dari',
    section: course?.category?.name || 'Tech courses',
    keywords: `${course?.title || ''}, ${course?.level || ''} tech course, TweackTech, Meyor Dari, learn ${course?.title || 'technology'}`,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, accessRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        isAuthenticated && user?.id
          ? api.get(`/courses/${courseId}/access`).catch(() => null)
          : Promise.resolve(null),
      ]);
      setCourse(unwrap(res));
      const accessData = accessRes ? unwrap(accessRes) : null;
      setCourseAccess(accessData);
      setEnrolled(Boolean(accessData?.enrolled));
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'This course could not be found.'
          : err.response?.data?.message || 'Unable to load this course.'
      );
    } finally {
      setLoading(false);
    }
  }, [api, courseId, isAuthenticated, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const modules = useMemo(() => course?.modules || [], [course]);
  const lessonCount = useMemo(
    () => modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0),
    [modules]
  );
  const firstLesson = useMemo(() => {
    for (const m of modules) {
      if (m.lessons?.length) return m.lessons[0];
    }
    return null;
  }, [modules]);

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }
    if (course?.enrollmentLocked) {
      setEnrollError(
        course.enrollmentLockedMessage ||
          'Enrolment for this course is temporarily closed.',
      );
      return;
    }
    if (course?.type !== 'FREE') {
      setPaymentOpen(true);
      setPaymentError('');
      setPaymentSuccess('');
      Promise.all([
        api.get('/payments/bank-accounts').catch(() => null),
        api.get('/payments/my?limit=100').catch(() => null),
      ]).then(([bankRes, paymentRes]) => {
        if (bankRes) setBankAccounts(unwrap(bankRes) || []);
        if (paymentRes) {
          const payments = unwrap(paymentRes)?.payments || [];
          const open = payments.find(
            (payment) =>
              (payment.course?.id === courseId || payment.courseId === courseId) &&
              ['PENDING', 'AWAITING_APPROVAL', 'REJECTED'].includes(payment.status),
          );
          setExistingPayment(open || null);
        }
      });
      return;
    }
    setEnrolling(true);
    setEnrollError('');
    try {
      await api.post(`/enrollments/enroll/${courseId}`);
      setEnrolled(true);
    } catch (err) {
      setEnrollError(getErrorMessage(err, 'Unable to enroll right now.'));
    } finally {
      setEnrolling(false);
    }
  };

  const startBankTransfer = async () => {
    setPaymentBusy(true);
    setPaymentError('');
    try {
      const res = await api.post('/payments/bank-transfer', {
        courseId,
        currency: paymentCurrency,
      });
      const data = unwrap(res);
      setPaymentData(data);
      setBankAccounts(data.bankAccounts || []);
      setExistingPayment(data.payment);
      setCurrency(paymentCurrency);
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to start the bank transfer.'));
    } finally {
      setPaymentBusy(false);
    }
  };

  const startPaystack = async () => {
    setPaymentBusy(true);
    setPaymentError('');
    try {
      const res = await api.post('/payments/paystack/initialize', {
        courseId,
        currency: paymentCurrency,
      });
      const data = unwrap(res);
      if (data?.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      setPaymentError('Card payments are not available right now. Please use bank transfer.');
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to start card payment.'));
    } finally {
      setPaymentBusy(false);
    }
  };

  const uploadProof = async (event) => {
    event.preventDefault();
    if (!existingPayment?.id || !proofFile) {
      setPaymentError('Choose a receipt image or PDF first.');
      return;
    }
    setPaymentBusy(true);
    setPaymentError('');
    try {
      const form = new FormData();
      form.append('file', proofFile);
      if (proofNote.trim()) form.append('note', proofNote.trim());
      await api.post(`/payments/${existingPayment.id}/proof`, form);
      setPaymentSuccess('Receipt uploaded. An admin will verify it and unlock the course.');
      setProofFile(null);
      setProofNote('');
      setExistingPayment({ ...existingPayment, status: 'AWAITING_APPROVAL' });
    } catch (err) {
      setPaymentError(getErrorMessage(err, 'Unable to upload the receipt.'));
    } finally {
      setPaymentBusy(false);
    }
  };

  const copyReference = async () => {
    const reference = paymentData?.payment?.reference || existingPayment?.reference;
    if (!reference) return;
    try {
      await navigator.clipboard.writeText(reference);
      setPaymentSuccess('Reference copied. Paste it into your transfer narration.');
    } catch {
      setPaymentError('Could not copy automatically — select the reference manually.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page grid gap-6 py-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="skeleton h-64 w-full rounded-2xl" />
            <div className="skeleton mt-5 h-8 w-2/3" />
            <div className="skeleton mt-3 h-4 w-1/2" />
          </div>
          <div className="card h-56 p-6">
            <div className="skeleton h-5 w-1/2" />
            <div className="skeleton mt-3 h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <BookOpen className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Course not found</h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {error || 'The course you are looking for may have been unpublished.'}
          </p>
          <Link to="/courses" className="btn-primary mt-2">
            Browse courses
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const outcomes = safeParse(course.outcomes, [
    'Structured, project-based lessons',
    'Assignments with instructor feedback',
    'Certificate of completion',
  ]);
  const requirements = safeParse(course.requirements, [
    'No prior experience required',
    'A computer and internet connection',
  ]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="container-page py-6">
        <Breadcrumbs
          items={[{ label: 'Courses', to: '/courses' }, { label: course.title }]}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            to={`/assignments?courseId=${courseId}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
          >
            View assignments for this course →
          </Link>
        </div>

        <ShareButtons
          className="mt-4"
          url={`/courses/${courseId}`}
          title={course.title}
          description={course.shortDescription || course.description}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-slate-800">
              <img loading="lazy" decoding="async"
                src={
                  course.thumbnail ||
                  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop'
                }
                alt=""
                className="h-64 w-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge bg-red-600 text-white">{typeLabel(course.type)}</span>
                  <span className="badge bg-white/15 text-white">{course.level}</span>
                  {course.category?.name && (
                    <span className="badge bg-white/15 text-white">{course.category.name}</span>
                  )}
                </div>
                <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  {course.title}
                </h1>
                <p className="mt-2 max-w-2xl text-slate-300">{course.shortDescription}</p>
                <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" /> {course.level}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> {course.duration || 'Self paced'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> {course._count?.enrollments ?? 0} students
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-4 w-4" /> {modules.length} modules · {lessonCount} lessons
                  </span>
                </div>
              </div>
            </div>

            {enrollError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400">
                {enrollError}
              </div>
            )}

            <div className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">About this course</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {course.description || course.shortDescription}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="card p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                  <Award className="h-5 w-5 text-red-600 dark:text-red-400" /> What you'll learn
                </h2>
                <ul className="mt-3 space-y-2">
                  {outcomes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Requirements</h2>
                <ul className="mt-3 space-y-2">
                  {requirements.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="card p-6 lg:sticky lg:top-24">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                  {course.type === 'FREE'
                    ? 'Free'
                    : course.price === null || course.price === undefined
                    ? 'Contact us'
                    : format(effectivePrice(course), course.currency || 'USD')}
                </p>
                {course.type !== 'FREE' && isDiscountActive(course) && (
                  <p className="text-sm font-semibold text-slate-400 line-through">
                    {format(course.price, course.currency || 'USD')}
                  </p>
                )}
              </div>
              {course.type !== 'FREE' && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Base price {course.currency || 'USD'} {effectivePrice(course).toFixed(2)} · pay in{' '}
                  {selected}
                  {isDiscountActive(course) ? ' · discount active' : ''}
                </p>
              )}
              {course.enrollmentLocked && (
                <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
                  {course.enrollmentLockedMessage ||
                    'Enrolment is temporarily closed for this course.'}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {course.type === 'PARTIAL'
                  ? 'Start with a partial payment and pay the rest later.'
                  : course.type === 'FREE'
                  ? 'Full access at no cost.'
                  : 'One-time payment, lifetime access.'}
              </p>

              {enrolled ? (
                courseAccess?.enrollment?.status === 'COMPLETED' ? (
                  <div className="mt-4 space-y-2">
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                      You have completed this course. Lessons are open for review.
                    </div>
                    <Link
                      to={firstLesson ? `/courses/${courseId}/lessons/${firstLesson.id}` : `/courses/${courseId}`}
                      className="btn-primary w-full !py-3"
                    >
                      <PlayCircle className="h-5 w-5" /> Review lessons
                    </Link>
                    {courseAccess?.certificate && (
                      <Link
                        to={`/verify/${courseAccess.certificate.certificateCode}`}
                        className="btn-secondary w-full !py-2.5"
                      >
                        <Award className="h-4 w-4" /> View certificate
                      </Link>
                    )}
                  </div>
                ) : (
                  <Link
                    to={firstLesson ? `/courses/${courseId}/lessons/${firstLesson.id}` : `/courses/${courseId}`}
                    className="btn-primary mt-4 w-full !py-3"
                  >
                    <PlayCircle className="h-5 w-5" /> Continue learning
                  </Link>
                )
              ) : course.enrollmentLocked ? null : (
                <button
                  type="button"
                  onClick={handleEnroll}
                  disabled={enrolling || course.enrollmentLocked}
                  className="btn-primary mt-4 w-full !py-3 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enrolling
                    ? 'Enrolling…'
                    : course.enrollmentLocked
                    ? 'Enrolment closed'
                    : isAuthenticated
                    ? 'Enroll now'
                    : 'Sign in to enroll'}
                  {!enrolling && !course.enrollmentLocked && <ArrowRight className="h-4 w-4" />}
                </button>
              )}

              {!isAuthenticated && (
                <p className="mt-2 text-center text-[11px] text-slate-400">
                  New here?{' '}
                  <Link to="/register" className="font-semibold text-red-600 dark:text-red-400">
                    Create a free account
                  </Link>
                </p>
              )}

              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> {course.duration || 'Learn at your own pace'}
                </li>
                <li className="flex items-center gap-2">
                  <Layers className="h-4 w-4" /> {modules.length} modules
                </li>
                <li className="flex items-center gap-2">
                  <Award className="h-4 w-4" /> Certificate on paid-course completion
                </li>
              </ul>
            </div>

            {(course.instructor || course.instructors?.length > 0) && (
              <div className="card p-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Instructor{course.instructors?.length ? 's' : ''}
                </h2>
                <div className="mt-3 space-y-3">
                  {[course.instructor, ...(course.instructors || []).map((row) => row.user)]
                    .filter(Boolean)
                    .map((person) => (
                      <div key={person.id} className="flex items-center gap-3">
                        {person.avatar ? (
                          <img loading="lazy" decoding="async" src={normalizeImageUrl(person.avatar)} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-xs font-bold text-red-700 dark:bg-red-950/60 dark:text-red-400">
                            {person.firstName?.[0]}
                            {person.lastName?.[0]}
                          </span>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">
                            {person.firstName} {person.lastName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Course instructor
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 p-5 dark:border-slate-800">
                <h2 className="font-bold text-slate-900 dark:text-white">Course curriculum</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {modules.length} modules · {lessonCount} lessons
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {modules.map((module) => (
                  <div key={module.id} className="p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {module.title}
                    </h3>
                    <div className="mt-2 space-y-1">
                      {(module.lessons || []).map((lesson) => {
                        const locked = !lesson.isFree && !enrolled;
                        const content = (
                          <>
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {lesson.order}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                                {lesson.title}
                              </span>
                              <span className="block text-[11px] text-slate-600 dark:text-slate-400">
                                {lesson.type} · {lesson.duration || 0} min
                              </span>
                            </span>
                            {locked ? (
                              <Lock className="h-4 w-4 text-slate-400" />
                            ) : (
                              <PlayCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                          </>
                        );

                        return locked ? (
                          <div
                            key={lesson.id}
                            className="flex cursor-not-allowed items-center gap-2 rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-800/40"
                          >
                            {content}
                          </div>
                        ) : (
                          <Link
                            key={lesson.id}
                            to={`/courses/${courseId}/lessons/${lesson.id}`}
                            className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            {content}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {paymentOpen && (
        <div className="modal-overlay fixed inset-0 z-[90] bg-slate-950/60">
          <div className="modal-card w-full max-w-lg border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="modal-header flex items-start justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-800 sm:px-6 sm:py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Pay for {course.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {formatIn(
                    convert(effectivePrice(course), course.currency || 'USD', paymentCurrency),
                    paymentCurrency,
                  )}{' '}
                  · choose how you want to pay.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentOpen(false)}
                className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Close payment"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-body space-y-4 px-4 py-4 sm:px-6 sm:py-5">
              {paymentError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                  {paymentError}
                </div>
              )}
              {paymentSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                  {paymentSuccess}
                </div>
              )}

              {!paymentData && !existingPayment && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('BANK_TRANSFER')}
                      className={`rounded-xl border p-3 text-left text-sm ${
                        paymentMethod === 'BANK_TRANSFER'
                          ? 'border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <Landmark className="mb-1 h-5 w-5 text-red-600" />
                      <span className="block font-semibold text-slate-900 dark:text-white">
                        Bank transfer
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Upload your receipt, admin approves.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('PAYSTACK')}
                      className={`rounded-xl border p-3 text-left text-sm ${
                        paymentMethod === 'PAYSTACK'
                          ? 'border-red-500 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <CreditCard className="mb-1 h-5 w-5 text-red-600" />
                      <span className="block font-semibold text-slate-900 dark:text-white">
                        Card · Paystack
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Instant when enabled.
                      </span>
                    </button>
                  </div>

                  <div>
                    <label htmlFor="payment-currency" className="label">Pay in</label>
                    <select
                      id="payment-currency"
                      value={paymentCurrency}
                      onChange={(event) => setPaymentCurrency(event.target.value)}
                      className="input-field"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} — {currency.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Amount: {formatIn(
                        convert(effectivePrice(course), course.currency || 'USD', paymentCurrency),
                        paymentCurrency,
                      )}{' '}
                      (converted at today's rate)
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <p className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      Bank transfers are verified by an admin. Paystack charges instantly and
                      enrols you automatically when configured.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={paymentMethod === 'BANK_TRANSFER' ? startBankTransfer : startPaystack}
                    disabled={paymentBusy}
                    className="btn-primary w-full !py-3"
                  >
                    {paymentBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    {paymentBusy
                      ? 'Starting…'
                      : paymentMethod === 'BANK_TRANSFER'
                      ? 'Continue to bank transfer'
                      : 'Pay with Paystack'}
                  </button>
                </>
              )}

              {(paymentData || existingPayment) && (
                <>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      {paymentData?.payment?.reference || existingPayment?.reference || 'Payment pending'}
                    </p>
                    <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                      Transfer{' '}
                      {formatIn(
                        existingPayment?.amount || 0,
                        existingPayment?.currency || paymentCurrency,
                      )}{' '}
                      and use the reference as the narration. Then upload your receipt below.
                    </p>
                    <button
                      type="button"
                      onClick={copyReference}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-900 underline dark:text-amber-200"
                    >
                      <Copy className="h-3 w-3" /> Copy reference
                    </button>
                  </div>

                  {bankAccounts.length > 0 && (
                    <div className="space-y-2">
                      {bankAccounts.map((account) => (
                        <div key={account.id} className="rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                          <p className="font-semibold text-slate-900 dark:text-white">{account.bankName}</p>
                          <p className="font-mono text-base text-slate-700 dark:text-slate-300">{account.accountNumber}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {account.accountName} · {account.currency}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={uploadProof} className="space-y-3">
                    <div>
                      <label htmlFor="course-proof" className="label">
                        Upload proof (JPG, PNG, PDF)
                      </label>
                      <input
                        id="course-proof"
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(event) => setProofFile(event.target.files?.[0] || null)}
                        className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-600 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                      />
                    </div>
                    <input
                      value={proofNote}
                      onChange={(event) => setProofNote(event.target.value)}
                      className="input-field"
                      placeholder="Sender name / note (optional)"
                    />
                    <button
                      type="submit"
                      disabled={paymentBusy || !proofFile}
                      className="btn-primary w-full"
                    >
                      <Upload className="h-4 w-4" />
                      {paymentBusy ? 'Uploading…' : 'Submit proof for approval'}
                    </button>
                  </form>

                  <Link to="/payments" className="btn-secondary block w-full text-center">
                    View my payments
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default CourseDetail;
