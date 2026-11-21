# TweackTech LMS — Feature Update

This build adds the requested LMS, payments, chat, calendar, talent, permission,
email and offline capabilities. It has been migrated and seeded against the
configured Neon database, and both the API and React client build successfully.

## Detailed lessons, Code Playground and AI tutor

### Real, example-driven lesson guides
- All 368 lesson guides were replaced with topic-specific, W3Schools-style
  tutorials generated from `backend/scripts/lib/lesson-library.js` (40 topics).
- Each lesson includes: a plain-language explanation, several runnable code
  examples with expected output, a step-by-step walkthrough, common mistakes,
  a practice task, and a summary.
- Regenerate at any time with `npm run upgrade:lessons` from `backend/`.
  `npm run seed:tiers` uses the same library for newly created lessons.
- The AI study partner reads these richer guides, so its explanations and
  answers are grounded in real lesson content.

### Code Playground (in-browser IDE)
- A **Code Playground** button on every lesson opens a full-screen editor with
  line numbers, Run / Reset / Copy controls and a console or preview panel.
- **JavaScript** runs in an isolated sandboxed iframe with `console.log` capture.
- **Python** runs locally through Pyodide (WebAssembly, lazy-loaded on first run).
- **SQL** runs through sql.js against seeded `students`, `courses` and
  `enrollments` demo tables.
- **PHP** shows the documented expected result because it needs a server runtime.
- HTML/CSS lessons render a live preview.
- The IDE starter code and expected output are read from the lesson's first
  runnable example block, so every lesson has a ready-to-run snippet.

### "Start reading" works across browsers (no AI, no API keys)
- Replaced the single long `speechSynthesis` utterance with short, sentence-sized
  chunks spoken one after another with a watchdog timer. Mobile browsers that
  cut off long speech (iOS Safari, Chrome Android) now finish the whole lesson.
- Added the iOS voice-unlock gesture, `voiceschanged` handling, `lang` and
  natural voice selection (prefers on-device premium/natural English voices),
  normalisation of stored voices, and a short pause between chunks.
- Pause/Resume, Stop, a device-voice picker and Slow/Normal/Fast speed controls
  are available next to **Start reading** on the lesson page and in Study mode.
- Reading text skips code blocks and prefixes list items, so it sounds less
  robotic. Everything runs on the browser's built-in speech engine — offline
  and free.

### Playground example fix, admin AI lock and quiz visibility
- Setup lessons no longer use terminal commands (`python --version`,
  `node --version`) as the playground's starter code — those caused
  `NameError: name 'python' is not defined`. All 368 starter snippets are now
  real, runnable code (verified: `Python is ready: 3.12.1`).
- The authentication lesson's Python/JavaScript examples no longer depend on
  `bcrypt` or `require('crypto')`, which are unavailable in the browser.
- Admins can lock the AI study partner from the **AI study partner** card on
  the admin dashboard. The flag is stored in `SiteSetting` (`ai_tutor_enabled`),
  exposed through `GET/PATCH /api/ai/config`, enforced server-side and hidden
  everywhere in the UI when off (students keep guides, playground and quizzes).
- The module quiz card only appears when a quiz exists and has not been passed
  ("Start quiz"). Passing it replaces the card with a small "Module quiz passed"
  indicator instead of a permanent retake button.

### Locked lessons stay locked
- Lesson locks are resolved from a single server-authoritative access record and
  fail closed when data is missing.
- Study mode closes automatically if the current lesson becomes locked.
- The progress API enforces the same module-quiz gate as the UI, so locked
  lessons cannot be completed by calling the endpoint directly.

## What was added

### Courses, instructors and scheduled content
- Assign a **lead instructor** and multiple **co-instructors** to a course.
- New **admin course builder** at `/admin/courses/:id`:
  - add / edit / delete modules and lessons
  - publish or draft modules and lessons
  - upload/attach video, YouTube, PDF, slide, doc or link lessons
  - schedule a module or lesson to unlock after **N days from enrolment** or at
    a fixed date/time
  - schedule live sessions with a reminder window
- Server-side unlock enforcement: students cannot mark a locked lesson complete
  even if they request the endpoint directly.
- `/api/courses/:id/access` returns the student's unlock state, completion,
  payment status and certificate eligibility.

### Users and roles
- Superadmins can change roles and grant section-level permissions.
- **Add user** on `/admin/users` creates the account immediately, generates a
  one-time temporary password (`TT-xxxxxxxx!`), emails the branded welcome
  message, and shows the password once in the UI with a copy button. Mail
  failures never block account creation, so the admin can always share the
  password manually.
- New accounts can sign in with the temporary password right away and change it
  from **Settings** later.

### Payments
- **Bank transfer** flow:
  1. student selects bank transfer and a payment currency
  2. a unique reference and NGN/GHS bank accounts are shown
  3. student uploads a JPG/PNG/WEBP/PDF receipt (4 MB max — Vercel request limit)
  4. admin reviews the proof, then approves or rejects with a note
  5. approval creates/activates the enrolment and sends the access email
- **Paystack-ready** card flow:
  - `POST /api/payments/paystack/initialize`
  - `POST /api/payments/paystack/verify`
  - signed webhook at `POST /api/payments/paystack/webhook`
  - set `PAYSTACK_SECRET_KEY` to enable it; without a key the API returns a
    friendly “use bank transfer” message
- Admin payments console at `/admin/payments` with proof preview, approval
  queue, revenue stats and bank-account management.
- Currency conversion for **NGN, GHS, USD, GBP and EUR** (rates in
  `CurrencyRate`; defaults seeded). The navbar currency selector is global.
- Payment amounts store both the charged currency and the course's base
  currency for accurate reporting.

### Certificates
- Certificates are issued automatically only when:
  - the course is paid (not `FREE`), **and**
  - every published lesson is complete, **and**
  - the student has an approved payment.
- Certificate email is sent via Resend and the public verification page is at
  `/verify/:code`.
- Admin/manual generation also requires paid + completed enrolment.

### Chat and support
- Course class chat rooms are created automatically for enrolled students and
  their instructors.
- Direct **tutor ↔ student** chat, group rooms and a support room.
- `/messages` workspace with unread badges, polling updates and read markers.
- Support chatbot widget on public pages, with quick replies and **“Talk to a
  human”** escalation that creates a support ticket and support chat room.
- Public chatbot endpoint: `POST /api/chatbot/message`.

### Assignments and quizzes
- Assignment types: `TEXT`, `FILE`, `PROJECT`, `QUIZ`.
- Quiz builder at `/admin/assignments` → **Questions**:
  - single-choice, multiple-choice, true/false and short-answer questions
  - per-question points and explanations
  - single add or **bulk JSON import**
  - auto-marking on submit with correct answers, explanations and pass/fail
- **Bulk assignment creation** from JSON for a course.
- Students get an interactive quiz runner with instant results and review.
- The seeded **React Fundamentals Quiz** has 10 single-choice questions
  (Google-Forms style), 1 point each, `maxScore = 10`, pass mark `6/10`.
  Scoring is automatic on submit; no manual grading step is needed.

### Calendar and reminders
- `/calendar` shows live classes scheduled by instructors and assignment due
  dates, with Google Calendar export and optional browser notifications.
- In-process reminder worker checks every minute, sends in-app notifications
  and branded email reminders before sessions.

### Talent Hub
- Database-backed `/talent` directory and `/talent/:id` profile pages (the
  former 404 detail route is fixed).
- Admin management at `/admin/talent` with create/edit/publish/feature/delete.
- Professionals can be messaged directly from their profile.

### Permissions and account security
- Admin sidebar items and pages are filtered by capability:
  `MANAGE_USERS`, `MANAGE_COURSES`, `MANAGE_BLOG`, `MANAGE_JOBS`,
  `MANAGE_SUPPORT`, `MANAGE_PAYMENTS`, `MANAGE_TALENT`, `MANAGE_CHAT`,
  `MANAGE_CERTIFICATES`, `GRADE_ASSIGNMENTS`, `MANAGE_SETTINGS`.
- Direct URL access to an unauthorised admin page is redirected by a route
  guard; the same rules are enforced by the API.
- The user permission modal now lists the **page URLs** each capability opens.
- Accounts are checked by a 10-second heartbeat plus every API request. A
  disabled account is signed out and redirected to login; disabling also
  invalidates reset tokens and sends a branded email.

### Email (Resend)
- Branded responsive template with TweackTech styling supports:
  welcome, password reset, certificate, payment received/approved/rejected,
  enrolment, account disabled, session reminder, assignment graded, promotion
  and generic messages.
- Transactional sends are non-blocking for business flows and are logged in
  `EmailLog` (`/api/email/logs`).
- Admin test and campaign endpoints:
  - `POST /api/email/test`
  - `POST /api/email/promotion`
- **Resend test-domain note:** `onboarding@resend.dev` can only deliver to the
  Resend account owner (`meyorpop@gmail.com`). Verify your domain in Resend and
  set `EMAIL_FROM="TweackTech <hello@yourdomain.com>"` before emailing students.

### Offline / database outage handling
- The API no longer crashes when the database is unreachable at boot; it starts
  in degraded mode and reconnects automatically.
- Prisma connection failures (`P1001`, `P2024`, etc.) are mapped to a clean
  `503` with `code: "DATABASE_OFFLINE"` — never the raw Prisma stack.
- `/api/health` reports database status.
- The React client shows a dismissible connection banner with a retry button,
  caches catalogue data through the service worker, and uses friendly error
  copy on login/payment forms.
- `GET /api/health` is public so the client can check recovery.

### Job applications
- Fixed stale “Application sent” state when navigating between jobs; the state
  is now reset per job and only matches an application for the current job.

## Setup

```bash
# API
cd backend
npx prisma migrate deploy        # applies the new migration
npm run prisma:seed              # currencies, bank accounts, talent, chat, quiz, session
npm run build
npm run start:prod               # or npm run start:dev

# Web
cd ..
npm start                        # uses REACT_APP_API_URL=http://localhost:5001/api
```

Apply the migration **before** restarting the API. The new migration is
`backend/prisma/migrations/20261113190000_lms_features/migration.sql`.

### Environment
Backend `.env` (already populated locally; never commit it):

```env
RESEND_API_KEY=re_...
EMAIL_FROM=TweackTech <onboarding@resend.dev>
SUPPORT_EMAIL=tweackchech@gmail.com
PAYSTACK_SECRET_KEY=
PAYSTACK_PUBLIC_KEY=
```

Frontend `.env`:

```env
REACT_APP_API_URL=http://localhost:5001/api
```

### Demo accounts
All seeded accounts use `password@123`:

- Superadmin: `meyorpop@gmail.com`
- Admin: `admin@tweacktech.com`
- Staff/instructor: `staff@tweacktech.com`
- Student: `student@tweacktech.com`

Seeded NGN/GHS bank accounts are under **Admin → Payments → Bank accounts**.

---

## Latest update

### Shared details and social sharing
- Course, job, talent and blog detail pages now expose a share bar with **copy link**,
  Facebook, X, WhatsApp, LinkedIn, Telegram, email and Instagram copy-to-clipboard.
- The native share sheet is used on supported mobile browsers.

### Study mode and lesson reading
- Every lesson has a long-form `readingContent` guide (admin editable in the course
  builder under **Reading guide / lesson notes**).
- Students can open **Study mode** from the lesson page: distraction-free video,
  reading guide, focus timer, auto-saved personal notes, progress and lesson navigation.
- The focus timer **starts automatically** on entering Study mode and resets for
  each new lesson.
- Clicking **Next lesson** saves completion for the current lesson before moving
  on (and finishing the last lesson takes the student to assignments). The save
  call is optimistic: navigation does not wait for a second access refresh.
- YouTube lessons render a full-width thumbnail card with a play overlay and a
  **Watch on YouTube** button instead of an iframe, so non-embeddable videos work.
- Existing lessons were backfilled with reading guides; admins can replace them with
  course-specific material.

### Completed courses
- Completing a course closes further progress updates (server-enforced and reflected
  in the player). Students can still review lessons and open their certificate.
- The course page shows **Review lessons / View certificate** once a course is complete.

### Scholar certificate
- Replaced the simple certificate with a scholar-style certificate: gold double border,
  the **TWEACKTECH** watermark, official seal, certificate ID, verification URL and the
  **Meyor Pop, Founder & CEO** signature line.
- The same artwork drives the dashboard print/download and the public `/verify/:code` page.
- Certificate emails include the certificate style, ID, grade and verification link.
- Grading a final assignment now checks certificate eligibility, so the assignment result
  email can include the certificate link as soon as it becomes available.

### Role-scoped dashboards
- Students only see their own enrolments, assignments, applications and certificates.
- Staff are sent to a teaching dashboard showing only courses they lead or co-teach,
  their students, recent submissions and grading counts.
- Staff course lists, course builder access and assignment course pickers are filtered
  server-side; opening an unassigned course builder returns **403**.
- Admins retain the platform-wide admin dashboard.

### Discounts and enrolment lock
- Admins can set a discount price with a start/end window; the active price is used on
  course cards, course detail, checkout and payment creation.
- Admins can lock enrolment with a custom message. The enrol button is disabled and both
  enrolment and payment APIs reject attempts while locked.
- Discount and lock controls are in **Admin → Courses → Edit**.

### Profile and password
- `/profile` now has an editable profile form: phone, location, bio, website, GitHub,
  LinkedIn and X/Twitter. Staff can also set rate and availability.
- Email, name and avatar are read-only and the API ignores attempts to change them.
- Users can change their own password from the profile page (current password required).

### Pusher realtime
- Server-side Pusher is configured with the provided app credentials; secrets stay in
  `backend/.env`.
- Private channels:
  - `private-user-{userId}` for instant notifications, payment/support/application updates
    and immediate sign-out when an account is disabled.
  - `private-chat-{roomId}` for instant chat messages.
  - `private-admin` for new payment proofs, support tickets, job applications and
    assignment submissions.
- `POST /api/pusher/auth` authorises private channels; only room members/instructors,
  the user’s own channel, or management users can subscribe.
- Pusher events are fire-and-forget, so a realtime provider delay never slows an API
  response. Polling remains as a fallback when the key is absent.
- Frontend keys live in the root `.env`:
  ```env
  REACT_APP_PUSHER_KEY=...
  REACT_APP_PUSHER_CLUSTER=eu
  ```

### Performance and refresh fixes
- The auth heartbeat no longer replaces the user object when the profile is unchanged;
  course pages no longer re-fetch every 10 seconds.
- Course detail/player fetch the course and access state in parallel and no longer make
  redundant enrollment/payment calls.
- Chat unread counts use a single SQL aggregate instead of a query per room; course-room
  setup runs in parallel and message sending is optimistic.
- Public course/job/talent/blog reads have short `Cache-Control` windows and API responses
  are gzip-compressed.
- Pusher makes chat, notifications and admin queues reactive without aggressive polling.

### Contact email
- Public support/contact references now use **tweackchech@gmail.com** (site settings,
  privacy policy, footer, contact/FAQ/terms/cookies, chatbot, email templates and env).
- The seeded superadmin login remains `meyorpop@gmail.com`; it is an account credential,
  not a public contact address.

### Course invitations (admin/staff)
- **Admin → Courses → open a course → Invite student**.
- Only admin/superadmin can invite to any course. Staff can invite only to courses they
  lead or co-teach; the API returns **403** for an unassigned course.
- Choose **Free access**: the student is enrolled immediately and receives an in-app
  notification + branded email.
- Choose **Paid access**: a pending `INVITATION` payment is created. The student sees it on
  `/payments`, uploads a bank-transfer receipt, and admin approval accepts the invitation
  and creates the enrolment automatically.
- Invitations are listed in the course builder with access type, status and payment state;
  pending paid invitations can be revoked.
- Students see invitations on their dashboard and pending payments on the payments page.

### Certificate PDF download
- Certificate actions now download a real **A4 landscape PDF**, one page, with gold border,
  watermark, seal, signature, certificate ID and verification URL. No browser print dialog
  is required.
- The PDF is generated client-side with jsPDF and named after the certificate code.


### Admin dashboard, activity log, mentor banners and attendance (new)
- **Admin dashboard (`/admin`)**: a rich overview for admins/superadmins with platform
  stats, six-month enrolment trend, today's attendance rate, revenue by currency, top
  courses, recent users, upcoming live sessions and a live activity feed. Staff see a
  teaching-focused dashboard with their courses and pending submissions.
- **Activity log (`/admin/activity`)**: admins can search/filter a complete audit trail of
  writes (users, courses, payments, assignments, attendance, mentor profiles and logins).
  Sensitive fields such as passwords and tokens are stripped before storage.
- **Profile photos**: every user can upload or remove their own avatar from `/profile`
  (4MB limit, stored through the media service).
- **Mentor banners**: staff/admins can publish a mentor profile from `/profile` with a
  headline, bio, qualifications, skills, years of experience and social links. Public
  profiles are listed on `/mentors`, featured on the landing page, and each has a detail
  page with their courses plus WhatsApp, X, LinkedIn, Facebook, Telegram and copy-link
  sharing to promote their courses and skills.
- **Attendance & scores (`/admin/attendance`)**: mentors can pick any course and date,
  toggle each enrolled student present/absent at any time, mark everyone present, and
  record a 0–100 score per student. Scores and attendance rates are shown to students on
  `/dashboard` and can be used as a grading input. Every change is written to the activity log.

### Superadmin student preview and full user editing
- Superadmins can open **Student view** from the admin overview or the sidebar's
  "Student dashboard" link at `/student-dashboard`. It renders the normal learner
  dashboard (courses, assignments, certificates, attendance) with a preview banner
  and a quick route back to `/admin`. `/dashboard` still routes management accounts
  to their own dashboards.
- Superadmins get an **Edit** action on every row in `/admin/users`. The editor
  updates name, email (with duplicate check), role, capabilities, phone, location,
  bio and profile photo in one request via `PATCH /api/users/:id/profile`. Only a
  superadmin can call it; every change is recorded in the activity log.
- Users can also upload or remove their own avatar from `/profile` (4MB limit).

### Share previews and SEO
- Every public detail page (mentors, courses, blog posts, jobs, talent profiles)
  now has its own title, description, author, keywords, canonical URL and
  Open Graph / Twitter Card tags. The avatar, course thumbnail, blog image,
  company logo or talent photo is used as that page's social preview image.
- `scripts/prerender-meta.js` runs automatically after `npm run build` and writes
  a static HTML file for each public route with crawler-readable metadata —
  social networks and Google read raw HTML and do not run the React app.
- Structured data (Organization, WebSite, page/Article) and site-wide keywords
  include “tech tweack”, TweackTech, Meyor Dari and Dari for Google.
- Cloudinary images are delivered with `f_jpg,q_auto`, so iPhone HEIC profile
  photos display in every browser and in social previews. New image uploads are
  also normalised to JPG at upload time.


### Mentors management, grouped admin navigation and integrations
- `/admin/mentors` lets admins manage mentor banners, qualifications, skills,
  published/featured state and the image used in social previews.
- Course-related admin pages (Courses, Assignments, Attendance) are grouped under
  a collapsible **Manage courses** section in the sidebar.
- Deleting a course now removes dependant certificates, payments, reviews, live
  sessions and enrollments in a transaction, so it no longer fails with a
  foreign-key constraint.
- Admins with MANAGE_USERS can reset any non-superadmin user's password and copy
  the generated temporary password from the admin UI.
- n8n can publish blog posts through `POST /api/integrations/n8n/blog` with an
  API key; posts show on the blog and on the homepage.

### Launch readiness: course links, speed, tiered curriculum and module quizzes
- Admin course builder has direct **Assignments** and **Attendance** links that preselect
  the course; the public course page links to that course's filtered assignments.
- GET requests retry once on transient network/5xx failures, images lazy-load, and profile
  hydration/route prefetch remain in place for faster startup.
- `npm run seed:tiers` adds PHP, Python Backend and Node.js Backend in Beginner,
  Intermediate and Advanced versions (9 courses, 4 modules × 4 lessons each) with rich
  HTML lesson guides, worked examples and practice tasks. It also upgrades generic guides
  on all existing courses.
- `npm run seed:quizzes` adds one auto-graded quiz per module across all courses (68
  quizzes, 340 questions). Pass mark is 6/10.
- Module progression is gated: lessons in the next module stay locked until the previous
  module's quiz is passed. Courses without module quizzes remain ungated.
- Study mode renders lesson guides as formatted HTML, includes **Read aloud** (browser
  text-to-speech), and respects the module gate on **Next lesson**.

### Quiz standard
Every module quiz has exactly **10 single-choice questions** (1 point each), a
**10-point score**, and an **80% pass mark (8/10)**. The next module stays locked until
the previous module's lessons are complete and its quiz is passed at 80% or higher.
Run `npm run upgrade:quizzes` in `backend/` to enforce this on an existing database.
