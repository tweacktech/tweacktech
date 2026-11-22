import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  FileText,
  Layers,
  Lock,
  Pause,
  Play,
  PlayCircle,
  Presentation,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Timer,
  X,
  Youtube,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';
import Breadcrumbs from '../Component/Breadcrumbs';
import { useAuth } from '../AuthContext';
import QuizRunner from '../Component/QuizRunner';
import AiTutor from '../Component/AiTutor';
import CodePlayground from '../Component/CodePlayground';
import ReadAloud from '../Component/ReadAloud';
import { detectLanguage, extractCode, extractOutput } from '../lib/lessonCode';

const unwrap = (res) => (res?.data && res.data.data !== undefined ? res.data.data : res?.data);

// Lesson guides are stored as HTML. Render them safely and strip tags for TTS.
const safeHtml = (html) => ({
  __html: String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, ''),
});

const youtubeId = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  return match ? match[1] : null;
};

const isPdf = (lesson) =>
  lesson?.type === 'PDF' ||
  lesson?.contentType === 'application/pdf' ||
  /\.pdf(\?|$)/i.test(lesson?.contentUrl || '');

const LessonContent = ({ lesson }) => {
  const url = lesson?.contentUrl;
  const ytId = lesson?.type === 'YOUTUBE' || /youtu/.test(url || '') ? youtubeId(url) : null;
  const [thumbIndex, setThumbIndex] = useState(0);
  const thumbSources = ytId
    ? [
        `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`,
        `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      ]
    : [];

  useEffect(() => {
    setThumbIndex(0);
  }, [ytId]);

  if (ytId) {
    const thumb = thumbSources[thumbIndex];
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        aria-label={`Watch ${lesson.title} on YouTube`}
        className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl shadow-slate-900/10 dark:border-slate-800"
      >
        {thumb ? (
          <img
            key={thumb}
            src={thumb}
            alt=""
            loading="lazy"
            onError={() => setThumbIndex((value) => value + 1)}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 bg-gradient-to-br from-red-600 via-red-800 to-slate-950" />
        )}

        <span className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-slate-950/10" />

        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
          <Youtube className="h-3.5 w-3.5 text-red-500" /> YouTube lesson
        </span>

        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-red-600 text-white shadow-2xl shadow-red-900/50 transition duration-300 group-hover:scale-110 group-hover:bg-red-500 sm:h-20 sm:w-20">
            <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9" />
          </span>
        </span>

        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 sm:p-5">
          <span className="min-w-0">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Now playing
            </span>
            <span className="mt-1 block truncate text-base font-bold text-white sm:text-lg">
              {lesson.title}
            </span>
            <span className="mt-1 block text-xs text-white/70">
              Opens on YouTube in a new tab
            </span>
          </span>
          <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-bold text-slate-900 shadow-lg sm:inline-flex">
            Watch on YouTube <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </span>
      </a>
    );
  }

  if (url && (lesson?.type === 'VIDEO' || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url))) {
    return (
      <div className="overflow-hidden rounded-2xl bg-black">
        <video controls className="aspect-video w-full" src={url} />
      </div>
    );
  }

  if (url && isPdf(lesson)) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <object data={url} type="application/pdf" className="h-[70vh] w-full">
          <div className="p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              This PDF cannot be displayed inline.
            </p>
            <a href={url} target="_blank" rel="noreferrer" className="btn-primary mt-4">
              Open PDF
            </a>
          </div>
        </object>
      </div>
    );
  }

  // No attachment: the reading guide below is the lesson, so do not render an
  // empty placeholder that pushes real content off small screens.
  if (!url) return null;

  // Slides / docs / links: show a friendly resource card.
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
        {lesson?.type === 'SLIDE' ? (
          <Presentation className="h-7 w-7" />
        ) : (
          <FileText className="h-7 w-7" />
        )}
      </span>
      <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">{lesson?.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
        {lesson?.description ||
          'Open the lesson resource to follow along. Slides, documents, and links open in a new tab.'}
      </p>
      <a href={url} target="_blank" rel="noreferrer" className="btn-primary mt-5">
        <ExternalLink className="h-4 w-4" /> Open lesson resource
      </a>
    </div>
  );
};


const StudyMode = ({
  course,
  courseId,
  api,
  lesson,
  reading,
  enrollment,
  isCompleted,
  courseCompleted,
  marking,
  markError,
  onComplete,
  onNext,
  onExit,
  prevLesson,
  prevLocked,
  nextLesson,
  nextLocked,
  moduleQuizId,
  moduleQuizPassed,
  currentModule,
  showQuiz,
  quizFailed,
  onQuizSubmitted,
  progressPct,
  completedCount,
  totalLessons,
  certificate,
  aiTutor,
  setAiTutor,
  aiEnabled,
  ide,
  onOpenIde,
  ideOpen,
  setIdeOpen,
}) => {
  const [seconds, setSeconds] = useState(25 * 60);
  const [quizOpen, setQuizOpen] = useState(false);
  const [running, setRunning] = useState(true);
  const [notes, setNotes] = useState(
    () => localStorage.getItem(`tweack-notes-${lesson?.id}`) || '',
  );

  useEffect(() => {
    if (!running || seconds <= 0) return undefined;
    const timer = setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [running, seconds]);

  useEffect(() => {
    setNotes(localStorage.getItem(`tweack-notes-${lesson?.id}`) || '');
    setSeconds(25 * 60);
    // Focus mode is meant to be productive immediately: the timer starts on
    // entry and restarts automatically for each new lesson.
    setRunning(true);
  }, [lesson?.id]);

  useEffect(() => {
    if (lesson?.id) localStorage.setItem(`tweack-notes-${lesson.id}`, notes);
  }, [lesson?.id, notes]);

  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onExit}
            className="btn-secondary !px-3 !py-2 text-xs"
          >
            <X className="h-4 w-4" /> Exit study mode
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {lesson?.title}
            </p>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {course?.title} · focus mode
            </p>
          </div>
          {aiEnabled && (
            <button
              type="button"
              onClick={() => setAiTutor((value) => !value)}
              className="btn-secondary !px-3 !py-2 text-xs"
              aria-pressed={aiTutor}
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">{aiTutor ? 'Hide AI tutor' : 'AI tutor'}</span>
            </button>
          )}
          {ide?.code && (
            <button type="button" onClick={onOpenIde} className="btn-secondary !px-3 !py-2 text-xs">
              <Terminal className="h-4 w-4" />
              <span className="hidden sm:inline">Code Playground</span>
            </button>
          )}
          <div className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200 sm:flex">
            <Timer className="h-4 w-4 text-red-600" />
            {minutes}:{secs}
            <button type="button" onClick={() => setRunning((value) => !value)} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label={running ? 'Pause timer' : 'Start timer'}>
              {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button type="button" onClick={() => { setSeconds(25 * 60); setRunning(false); }} className="rounded p-1 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Reset timer">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>
          {enrollment && (
            <button
              type="button"
              onClick={onComplete}
              disabled={marking || isCompleted || courseCompleted}
              className={isCompleted || courseCompleted ? 'btn-secondary !py-2 text-xs' : 'btn-primary !py-2 text-xs'}
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCompleted ? 'Completed' : courseCompleted ? 'Course completed' : marking ? 'Saving…' : 'Mark complete'}
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 gap-5 p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 max-w-full space-y-5">
          <LessonContent lesson={lesson} />

          <div className="card p-6">
            <span className="badge bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {lesson?.type}
            </span>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {lesson?.title}
            </h1>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {lesson?.description ||
                `In this lesson you will work through ${lesson?.title?.toLowerCase()} with practical, hands-on examples.`}
            </p>
            {markError && <p className="mt-3 text-sm text-red-600">{markError}</p>}
          </div>

          <div className="card min-w-0 max-w-full overflow-hidden p-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <BookOpen className="h-5 w-5 shrink-0 text-red-600" /> Reading guide
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <ReadAloud html={reading} lessonId={lesson?.id} compact />
              {ide?.code && (
                <button type="button" onClick={onOpenIde} className="btn-primary !py-1.5 text-xs">
                  <Terminal className="h-3.5 w-3.5" /> Try in Code Playground
                </button>
              )}
            </div>
            <div
              className="prose prose-slate mt-4 max-w-full overflow-x-auto break-words text-sm leading-7 text-slate-600 dark:prose-invert dark:text-slate-300"
              dangerouslySetInnerHTML={
                reading
                  ? safeHtml(reading)
                  : {
                      __html:
                        'The instructor has not added a reading guide yet. Use the lesson description and video, then ask a question in the class chat.',
                    }
              }
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            {prevLesson ? (
              <button
                type="button"
                onClick={() => onNext(prevLesson.id)}
                disabled={prevLocked}
                className="btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <button
                type="button"
                onClick={() => onNext(nextLesson.id)}
                disabled={marking || nextLocked}
                className="btn-primary"
              >
                {marking ? 'Saving…' : nextLocked ? 'Pass module quiz to continue' : 'Next lesson'}{' '}
                {nextLocked ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNext(null)}
                disabled={marking}
                className="btn-primary"
              >
                {marking ? 'Saving…' : 'Finish & go to assignments'} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </section>

        <aside className="min-w-0 max-w-full space-y-4">
          {aiEnabled && aiTutor && <AiTutor api={api} lessonId={lesson?.id} lessonTitle={lesson?.title} />}

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Course progress
              </h2>
              <span className="text-sm font-extrabold text-red-600 dark:text-red-400">{progressPct}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2 rounded-full bg-red-600" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {completedCount} of {totalLessons} lessons complete
            </p>
            {moduleQuizPassed && (
              <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> Module quiz passed
              </p>
            )}
          </div>

          {/* One quiz card only, and only when the learner needs it: the module
              is finished (time to move on) or a previous attempt failed. */}
          {showQuiz && (
            <div className="card p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                <Award className="h-4 w-4 text-red-600" /> Module quiz
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {quizFailed
                  ? `You scored ${currentModule?.quizScore ?? 0}/${currentModule?.quizPassScore ?? 8}. You need ${
                      currentModule?.quizPassScore ?? 8
                    } to unlock the next module — retake when you are ready.`
                  : 'You have finished this module. Pass the quiz with 80% (8/10) or higher to unlock the next module.'}
              </p>
              <button
                type="button"
                onClick={() => setQuizOpen(true)}
                className="btn-primary mt-3 w-full !py-2 text-xs"
              >
                {quizFailed ? 'Retake quiz' : 'Take quiz'} →
              </button>
            </div>
          )}

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Timer className="h-4 w-4 text-red-600" /> Focus timer
            </h2>
            <p className="mt-2 text-center text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {minutes}:{secs}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <button type="button" onClick={() => setRunning((value) => !value)} className="btn-secondary !px-3 !py-2 text-xs">
                {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {running ? 'Pause' : 'Start'}
              </button>
              <button type="button" onClick={() => { setSeconds(25 * 60); setRunning(false); }} className="btn-secondary !px-3 !py-2 text-xs">
                <RotateCcw className="h-4 w-4" /> Reset
              </button>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">My notes</h2>
            <p className="mt-1 text-[11px] text-slate-400">Saved automatically for this lesson.</p>
            <textarea
              rows={8}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="input-field mt-2 text-sm"
              placeholder="Write down definitions, questions or code snippets…"
            />
          </div>

          {courseCompleted && (
            <div className="card border-emerald-200 p-5 text-center dark:border-emerald-900/60">
              <Award className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Course completed</p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                You are reviewing a completed course. Marking is closed.
              </p>
              {certificate && (
                <Link to={`/verify/${certificate.certificateCode}`} className="btn-primary mt-3 w-full !py-2">
                  View certificate
                </Link>
              )}
            </div>
          )}
        </aside>
      </main>

      {quizOpen && moduleQuizId && (
        <QuizRunner
          api={api}
          assignmentId={moduleQuizId}
          onClose={() => setQuizOpen(false)}
          onSubmitted={async () => {
            if (onQuizSubmitted) await onQuizSubmitted();
          }}
        />
      )}
      <CodePlayground
        open={ideOpen}
        onClose={() => setIdeOpen(false)}
        lessonTitle={lesson?.title}
        language={ide?.language}
        initialCode={ide?.code}
        expectedOutput={ide?.expectedOutput}
      />
    </div>
  );
};

const CoursePlayer = () => {
  const { courseId, lessonId } = useParams();
  const { api, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [access, setAccess] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState('');
  const [studyMode, setStudyMode] = useState(false);
  const [aiTutor, setAiTutor] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [ideOpen, setIdeOpen] = useState(false);

  const canManage = ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(user?.role);
  const enrolled = !!enrollment || canManage;

  useEffect(() => {
    api
      .get('/ai/config')
      .then((res) => setAiEnabled(unwrap(res)?.enabled !== false))
      .catch(() => setAiEnabled(true));
  }, [api]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseRes, accessRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        isAuthenticated && user?.id
          ? api.get(`/courses/${courseId}/access`).catch(() => null)
          : Promise.resolve(null),
      ]);
      const courseData = unwrap(courseRes);
      setCourse(courseData);

      const flat = (courseData?.modules || []).flatMap((module, moduleIndex) =>
        (module.lessons || []).map((lesson) => ({
          ...lesson,
          moduleId: module.id,
          moduleTitle: module.title,
          moduleIndex,
        }))
      );
      setLessons(flat);

      if (accessRes) {
        const accessData = unwrap(accessRes);
        setAccess(accessData);
        if (accessData?.enrolled && accessData.enrollment) {
          setEnrollment(accessData.enrollment);
          setCompleted(
            new Set(
              (accessData.lessons || [])
                .filter((item) => item.isCompleted)
                .map((item) => item.id),
            ),
          );
        } else {
          setEnrollment(null);
          setCompleted(new Set());
        }
      }
    } catch (err) {
      setError(
        err.response?.status === 404
          ? 'This course could not be found.'
          : err.response?.data?.message || 'Unable to load this lesson.'
      );
    } finally {
      setLoading(false);
    }
  }, [api, courseId, isAuthenticated, user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAccess = useCallback(async () => {
    try {
      const res = await api.get(`/courses/${courseId}/access`);
      const data = unwrap(res);
      if (data) setAccess(data);
      return data;
    } catch (error) {
      return null;
    }
  }, [api, courseId]);

  const currentIndex = useMemo(
    () => lessons.findIndex((lesson) => lesson.id === lessonId),
    [lessons, lessonId]
  );
  const currentLesson = currentIndex >= 0 ? lessons[currentIndex] : null;
  const nextLesson = lessons[currentIndex + 1] || null;
  const prevLesson = lessons[currentIndex - 1] || null;
  const currentModule = access?.modules?.find((item) => item.id === currentLesson?.moduleId);
  const moduleQuizId = currentModule?.quizId || null;
  const moduleQuizPassed = Boolean(currentModule?.quizPassed);
  const moduleLessonsDone = Boolean(
    currentModule &&
      currentModule.totalLessons > 0 &&
      currentModule.completedLessons >= currentModule.totalLessons,
  );
  const quizFailed = Boolean(
    currentModule?.quizAttempted && !currentModule.quizPassed,
  );
  // Only offer the quiz when the module is finished (time to move on) or the
  // student failed and needs a retake. Passing hides it completely.
  const showQuiz = Boolean(
    moduleQuizId && !moduleQuizPassed && (moduleLessonsDone || quizFailed),
  );

  // Access data from the server is the single source of truth for locks. It
  // fails closed: if a record is missing, an enrolled student's lesson stays
  // locked rather than accidentally opening. Only staff and genuinely free
  // previews bypass this check.
  const lessonIsLocked = useCallback(
    (id) => {
      if (!id || canManage) return false;
      const record = access?.lessons?.find((item) => item.id === id);
      if (record) return !record.isUnlocked;
      if (enrolled) return true;
      return !lessons.find((item) => item.id === id)?.isFree;
    },
    [access, canManage, enrolled, lessons],
  );

  const isLocked = currentLesson ? lessonIsLocked(currentLesson.id) : false;
  const prevLocked = prevLesson ? lessonIsLocked(prevLesson.id) : false;
  const nextLocked = nextLesson ? lessonIsLocked(nextLesson.id) : false;
  const accessLesson = access?.lessons?.find((item) => item.id === currentLesson?.id);

  const ide = useMemo(() => {
    if (!currentLesson) return null;
    const detected = extractCode(currentLesson.readingContent);
    return {
      language: detected.language || detectLanguage(course?.title),
      code: detected.code,
      expectedOutput: extractOutput(currentLesson.readingContent),
    };
  }, [currentLesson, course?.title]);

  // A locked lesson can never remain in Study mode, even if a stale flag or a
  // quick navigation tries to force it open.
  useEffect(() => {
    if (studyMode && isLocked) setStudyMode(false);
  }, [studyMode, isLocked]);
  const isCompleted = currentLesson ? completed.has(currentLesson.id) : false;
  const progressPct = access?.enrolled
    ? Math.round(access.progress || 0)
    : lessons.length
    ? Math.round((completed.size / lessons.length) * 100)
    : 0;
  const certificate = access?.certificate;
  const certificateEligible = access?.certificateEligible;
  const courseCompleted = enrollment?.status === 'COMPLETED';

  const saveProgress = async ({ refresh = true } = {}) => {
    if (!enrollment || !currentLesson) return { ok: false, access: null };
    setMarking(true);
    setMarkError('');
    try {
      await api.patch('/enrollments/progress', {
        enrollmentId: enrollment.id,
        lessonId: currentLesson.id,
        progress: 100,
      });
      setCompleted((prev) => new Set(prev).add(currentLesson.id));

      const fetchAccess = () =>
        api
          .get(`/courses/${courseId}/access`)
          .then((res) => unwrap(res))
          .catch(() => null);

      // Moving to the next lesson should never wait on a second round-trip:
      // revalidate access in the background and navigate immediately.
      if (!refresh) {
        fetchAccess().then((updatedAccess) => {
          if (!updatedAccess) return;
          setAccess(updatedAccess);
          if (updatedAccess.enrollment) setEnrollment(updatedAccess.enrollment);
        });
        return { ok: true, access: null };
      }

      const updatedAccess = await fetchAccess();
      if (updatedAccess) {
        setAccess(updatedAccess);
        if (updatedAccess.enrollment) setEnrollment(updatedAccess.enrollment);
      }
      return { ok: true, access: updatedAccess };
    } catch (err) {
      setMarkError(err.response?.data?.message || 'Unable to save your progress.');
      return { ok: false, access: null };
    } finally {
      setMarking(false);
    }
  };

  const markComplete = async () => {
    if (!enrollment || !currentLesson) return;
    const { ok, access: updatedAccess } = await saveProgress();
    if (!ok) return;
    const nextUnlocked =
      updatedAccess?.lessons?.find((item) => item.isUnlocked && !item.isCompleted) || null;
    if (nextUnlocked) {
      navigate(`/courses/${courseId}/lessons/${nextUnlocked.id}`);
    }
  };

  // "Next" always records completion before moving on, so progress can never
  // lag behind the lessons a learner has actually worked through. A locked
  // target lesson is never navigable, even from Study mode.
  const goToNext = async (targetId) => {
    if (targetId && lessonIsLocked(targetId)) return;
    if (enrollment && currentLesson && !isCompleted && !courseCompleted) {
      const { ok } = await saveProgress({ refresh: false });
      if (!ok) return;
    }
    navigate(targetId ? `/courses/${courseId}/lessons/${targetId}` : '/assignments');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page py-8">
          <div className="skeleton h-4 w-40" />
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="skeleton aspect-video w-full rounded-2xl" />
              <div className="skeleton mt-4 h-6 w-2/3" />
            </div>
            <div className="card h-64 p-5">
              <div className="skeleton h-5 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course || !currentLesson) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Navbar />
        <div className="container-page flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
            <BookOpen className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lesson not available</h1>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {error || 'This lesson may have been moved or unpublished.'}
          </p>
          <Link to={`/courses/${courseId}`} className="btn-primary mt-2">
            <ArrowLeft className="h-4 w-4" /> Back to course
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // A locked lesson must never open in Study mode, even if a stale URL or a
  // stale `studyMode` flag tries to force it.
  if (studyMode && currentLesson && !isLocked) {
    return (
      <StudyMode
        course={course}
        courseId={courseId}
        api={api}
        lesson={currentLesson}
        reading={currentLesson.readingContent}
        enrollment={enrollment}
        isCompleted={isCompleted}
        courseCompleted={courseCompleted}
        marking={marking}
        markError={markError}
        onComplete={markComplete}
        onNext={goToNext}
        onExit={() => setStudyMode(false)}
        prevLesson={prevLesson}
        prevLocked={prevLocked}
        nextLesson={nextLesson}
        nextLocked={nextLocked}
        moduleQuizId={moduleQuizId}
        moduleQuizPassed={moduleQuizPassed}
        currentModule={currentModule}
        showQuiz={showQuiz}
        quizFailed={quizFailed}
        onQuizSubmitted={refreshAccess}
        progressPct={progressPct}
        completedCount={completed.size}
        totalLessons={lessons.length}
        certificate={certificate}
        aiTutor={aiTutor}
        setAiTutor={setAiTutor}
        aiEnabled={aiEnabled}
        ide={ide}
        onOpenIde={() => setIdeOpen(true)}
        ideOpen={ideOpen}
        setIdeOpen={setIdeOpen}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <div className="container-page py-6">
        <Breadcrumbs
          items={[
            { label: 'Courses', to: '/courses' },
            { label: course.title, to: `/courses/${courseId}` },
            { label: currentLesson.title },
          ]}
        />

        <div className="mt-5 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="min-w-0 max-w-full space-y-5 lg:col-span-2">
            {isLocked ? (
              <div className="card flex flex-col items-center gap-4 p-12 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <Lock className="h-7 w-7" />
                </span>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  This lesson is locked
                </h2>
                <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
                  {!enrolled
                    ? `Enroll in ${course.title} to unlock every lesson, assignment, and your certificate.`
                    : accessLesson?.unlockAt &&
                      new Date(accessLesson.unlockAt).getTime() > Date.now()
                    ? `This lesson unlocks ${new Date(accessLesson.unlockAt).toLocaleString()}.`
                    : 'Pass the previous module quiz to unlock this lesson.'}
                </p>
                <div className="flex gap-2">
                  <Link to={`/courses/${courseId}`} className="btn-primary">
                    Enroll now
                  </Link>
                  {!isAuthenticated && (
                    <Link to="/login" className="btn-secondary">
                      Sign in
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <>
                {courseCompleted && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                    <p>
                      <strong>Course completed.</strong> Marking is closed — you can review every lesson or open your certificate.
                    </p>
                    {certificate && (
                      <Link to={`/verify/${certificate.certificateCode}`} className="btn-primary !px-3 !py-1.5 text-xs">
                        View certificate
                      </Link>
                    )}
                  </div>
                )}
                <LessonContent lesson={currentLesson} />

                <div className="card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <span className="badge bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                        {currentLesson.type}
                      </span>
                      <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        {currentLesson.title}
                      </h1>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {currentLesson.moduleTitle} · {currentLesson.duration || 0} min
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAiTutor(false);
                          setStudyMode(true);
                        }}
                        className="btn-secondary !py-2 text-xs"
                      >
                        <BookOpen className="h-4 w-4" /> Study mode
                      </button>
                      {aiEnabled && (
                        <button
                          type="button"
                          onClick={() => {
                            setAiTutor(true);
                            setStudyMode(true);
                          }}
                          className="btn-primary !py-2 text-xs"
                        >
                          <Sparkles className="h-4 w-4" /> Learn with AI
                        </button>
                      )}
                      {enrollment ? (
                        <button
                          type="button"
                          onClick={markComplete}
                          disabled={marking || isCompleted || courseCompleted}
                          className={isCompleted || courseCompleted ? 'btn-secondary' : 'btn-primary'}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isCompleted
                            ? 'Completed'
                            : courseCompleted
                            ? 'Course completed'
                            : marking
                            ? 'Saving…'
                            : 'Mark complete'}
                        </button>
                      ) : (
                        canManage && <span className="badge-info">Staff preview</span>
                      )}
                    </div>
                  </div>

                  {markError && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400">{markError}</p>
                  )}

                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {currentLesson.description ||
                      `In this lesson you will work through ${currentLesson.title.toLowerCase()} with practical, hands-on examples.`}
                  </p>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                    <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                      <BookOpen className="h-4 w-4 text-red-600" /> Lesson reading guide
                    </h2>
                    <div
                      className="prose prose-slate mt-2 max-h-[30rem] max-w-full overflow-x-auto overflow-y-auto break-words text-sm leading-7 text-slate-600 dark:text-slate-300 dark:prose-invert"
                      dangerouslySetInnerHTML={
                        currentLesson.readingContent
                          ? safeHtml(currentLesson.readingContent)
                          : {
                              __html:
                                'Your instructor has not added a reading guide yet. Use the description and video, then ask a question in the class chat.',
                            }
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setStudyMode(true)}
                      className="mt-3 text-xs font-semibold text-red-600 dark:text-red-400"
                    >
                      Open in Study mode →
                    </button>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    {prevLesson ? (
                      <Link
                        to={`/courses/${courseId}/lessons/${prevLesson.id}`}
                        className="btn-secondary"
                      >
                        <ArrowLeft className="h-4 w-4" /> Previous
                      </Link>
                    ) : (
                      <span />
                    )}
                    {nextLesson ? (
                      <button
                        type="button"
                        onClick={() => goToNext(nextLesson.id)}
                        disabled={marking || nextLocked}
                        className="btn-primary"
                      >
                        {marking ? 'Saving…' : nextLocked ? 'Pass module quiz to continue' : 'Next lesson'}{' '}
                        {nextLocked ? <Lock className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goToNext(null)}
                        disabled={marking}
                        className="btn-primary"
                      >
                        {marking ? 'Saving…' : 'Go to assignments'} <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <aside className="min-w-0 max-w-full space-y-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-slate-900 dark:text-white">Course progress</h2>
                <span className="text-sm font-extrabold text-red-600 dark:text-red-400">
                  {progressPct}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                <div className="h-2 rounded-full bg-red-600" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {completed.size} of {lessons.length} lessons complete
              </p>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Layers className="h-4 w-4" /> Lessons
                </h2>
              </div>
              <div className="max-h-[60vh] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
                {lessons.map((lesson, index) => {
                  const done = completed.has(lesson.id);
                  const active = lesson.id === lessonId;
                  const accessRow = access?.lessons?.find((item) => item.id === lesson.id);
                  const locked = enrolled
                    ? accessRow
                      ? !accessRow.isUnlocked
                      : false
                    : !lesson.isFree;
                  const Icon = done ? CheckCircle2 : locked ? Lock : PlayCircle;

                  const body = (
                    <>
                      <Icon
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          done
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : active
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm ${
                            active
                              ? 'font-bold text-red-600 dark:text-red-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {index + 1}. {lesson.title}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          {lesson.type} · {lesson.duration || 0} min
                          {locked && accessRow?.unlockAt
                            ? ` · unlocks ${new Date(accessRow.unlockAt).toLocaleDateString()}`
                            : ''}
                        </span>
                      </span>
                    </>
                  );

                  return locked ? (
                    <div key={lesson.id} className="flex items-start gap-2 px-4 py-3 opacity-60">
                      {body}
                    </div>
                  ) : (
                    <Link
                      key={lesson.id}
                      to={`/courses/${courseId}/lessons/${lesson.id}`}
                      className={`flex items-start gap-2 px-4 py-3 transition hover:bg-slate-50 dark:hover:bg-slate-800 ${
                        active ? 'bg-red-50 dark:bg-red-950/30' : ''
                      }`}
                    >
                      {body}
                    </Link>
                  );
                })}
              </div>
            </div>

            {certificate && (
              <div className="card border-emerald-200 p-5 text-center dark:border-emerald-900/60">
                <Award className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  Certificate unlocked
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {certificate.certificateCode}
                </p>
                <Link to={`/verify/${certificate.certificateCode}`} className="btn-primary mt-3 w-full !py-2">
                  View certificate
                </Link>
              </div>
            )}

            {!certificate && certificateEligible && (
              <div className="card border-emerald-200 p-5 text-center dark:border-emerald-900/60">
                <ShieldCheck className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                  You have completed this course
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Your certificate is being issued and emailed to you.
                </p>
              </div>
            )}

            {!enrollment && !canManage && (
              <div className="card p-5 text-center">
                <Youtube className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" />
                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                  Unlock the full course
                </p>
                <Link to={`/courses/${courseId}`} className="btn-primary mt-3 w-full">
                  Enroll now
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>

      <CodePlayground
        open={ideOpen}
        onClose={() => setIdeOpen(false)}
        lessonTitle={currentLesson.title}
        language={ide?.language}
        initialCode={ide?.code}
        expectedOutput={ide?.expectedOutput}
      />

      <Footer />
    </div>
  );
};

export default CoursePlayer;
