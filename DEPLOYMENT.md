# Deploying TweackTech to Vercel

Two Vercel projects deploy from one repository:

| Project | Root directory | Runtime | Output |
| --- | --- | --- | --- |
| `tweacktech-web` | repository root | Create React App | static `build/` |
| `tweacktech-api` | `backend/` | Node serverless function | `api/index.js` |

The React app talks to the API at `REACT_APP_API_URL` (for example
`https://tweacktech-api.vercel.app/api`). The API serves everything under
`/api`; Swagger is disabled on Vercel unless `ENABLE_SWAGGER=true`.

---

## 1. Database (Neon PostgreSQL)

Create (or reuse) a Neon project and copy two connection strings:

- **Pooled** (host contains `-pooler`): used by the deployed API.
- **Direct** (no `-pooler`): used only for migrations.

For serverless, append pooling parameters:

```text
postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/DB?sslmode=require&pgbouncer=true&connection_limit=1
```

`connection_limit=1` prevents every warm function instance from opening a
large pool. Neon's pooler does the real multiplexing.

Apply migrations from your machine (not from the function):

```bash
cd backend
DATABASE_URL="<direct, non-pooler URL>" npx prisma migrate deploy
```

The latest schema adds `ActivityLog`, `MentorProfile` and `AttendanceRecord` models.
For an existing Neon database that already has the earlier tables, the fastest safe
update is:

```bash
cd backend
DATABASE_URL="<direct, non-pooler URL>" npx prisma db push
```

This is non-destructive for additive changes. For a fresh database, `migrate deploy`
(above) applies the full history. The API also depends on `compression`; it is declared
in `backend/package.json` and treated as optional at runtime, so an older bundle still
starts without it.

Seed only on a fresh database:

```bash
cd backend
DATABASE_URL="<direct URL>" npm run prisma:seed
```

---

## 2. Backend project (`backend/`)

### Create the project

Vercel dashboard → **Add New → Project** → import the repository:

- **Root Directory:** `backend`
- **Framework Preset:** Other
- **Build Command:** `npm run vercel-build` (already in `backend/vercel.json`)
- **Output Directory:** leave empty
- **Install Command:** `npm install`

Or with the CLI:

```bash
cd backend
vercel link
vercel --prod
```

### Environment variables

Set these in **Project → Settings → Environment Variables** for Production
(and Preview if you use preview deployments):

| Variable | Example / notes |
| --- | --- |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Neon **pooled** URL with `pgbouncer=true&connection_limit=1` |
| `JWT_SECRET` | long random string |
| `JWT_REFRESH_SECRET` | different long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `FRONTEND_URL` | `https://tweacktech.vercel.app` |
| `CORS_ORIGIN` | `https://tweacktech.vercel.app` (comma-separated for more) |
| `API_URL` | `https://tweacktech-api.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud |
| `CLOUDINARY_API_KEY` | Cloudinary key |
| `CLOUDINARY_API_SECRET` | Cloudinary secret |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | `TweackTech <noreply@your-verified-domain.com>` |
| `SUPPORT_EMAIL` | support inbox |
| `PUSHER_APP_ID` | Pusher app id |
| `PUSHER_KEY` | Pusher key |
| `PUSHER_SECRET` | Pusher secret |
| `PUSHER_CLUSTER` | e.g. `eu` |
| `PAYSTACK_SECRET_KEY` | server-side only |
| `PAYSTACK_PUBLIC_KEY` | optional; never needed in the React bundle |
| `BCRYPT_SALT_ROUNDS` | `10` |
| `ENABLE_SWAGGER` | optional `true` to expose `/api/docs` |

Never put any of these in the frontend project. Only `REACT_APP_*` values are
shipped to browsers.

### How the serverless build works

- `vercel-build` runs `prisma generate && npm run build`.
- `npm run build` cleans `dist` and compiles with `tsconfig.build.json`
  (NestJS + `emitDecoratorMetadata`). This is required because Vercel's
  TypeScript/esbuild path does **not** emit NestJS DI metadata.
- `api/index.js` is plain JavaScript. It loads `dist/app.module` and
  `dist/app.bootstrap`, caches the Nest/Express instance between invocations,
  and is included with `dist/**` by `backend/vercel.json`.
- Prisma binary targets are `native` + `rhel-openssl-3.0.x`; the Prisma engine
  and client are added to the function via `includeFiles`.
- Uploads use memory storage and are streamed to Cloudinary. Vercel's
  filesystem is read-only, so Cloudinary is mandatory in production (local
  fallback to `uploads/` is skipped when `VERCEL` is set).

### Verify the deployment

```bash
curl https://<backend>.vercel.app/api/health
# {"success":true,...,"data":{"status":"ok","database":"up",...}}

curl -X POST https://<backend>.vercel.app/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@tweacktech.com","password":"password@123"}'
```

If the first request returns `503 API_BOOTSTRAP_FAILED`, Neon was probably
asleep. The handler resets its init promise and the next request retries.

---

## 3. Frontend project (repository root)

### Create the project

Vercel dashboard → **Add New → Project** → same repository:

- **Root Directory:** `.` (repository root)
- **Framework Preset:** Create React App (auto-detected)
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

`vercel.json` already provides SPA rewrites, long-lived caching for hashed
assets, `no-cache` for `index.html` and `service-worker.js`, service-worker
scope, and basic security headers. `.vercelignore` keeps `backend/`,
`Archive.zip`, and local build output out of the upload.

### Environment variables

Set these for Production (and Preview):

| Variable | Example |
| --- | --- |
| `REACT_APP_API_URL` | `https://tweacktech-api.vercel.app/api` |
| `REACT_APP_PUSHER_KEY` | Pusher public key |
| `REACT_APP_PUSHER_CLUSTER` | `eu` |

CRA inlines these at build time. **Redeploy the frontend after changing any
`REACT_APP_*` value.**

### Verify the deployment

- Open `/`, `/courses`, `/login`.
- Sign in with a demo account and check `/dashboard`, `/messages`, `/payments`.
- Open `/admin` with an admin/superadmin account.
- Browser devtools → Application → Service Workers shows `service-worker.js`
  activated; Manifest shows the TweackTech icons.
- Disconnect the network and reload `/` and `/courses`: the cached app shell
  and the last successful public API responses render with the offline banner.

---

## 4. CORS

The API allows:

- every origin listed in `CORS_ORIGIN` (comma-separated), and
- `FRONTEND_URL`, and
- any `https://*.vercel.app` host (preview deployments).

Set `CORS_ORIGIN` to the production frontend domain. A request from an
unlisted custom domain is rejected even if the app loads, so add it before
going live on a custom domain.

For local parity the development `.env` allows
`http://localhost:3000`, `http://localhost:5050`, and
`http://127.0.0.1:5050`.

---

## 5. PWA and service worker

- `public/manifest.json`: standalone display, theme colour, 192/512 PNGs,
  maskable icon, app shortcuts.
- `public/service-worker.js`: precaches the app shell and icons, cache-first
  for hashed static assets and images, network-first for public API reads with
  cache fallback, never caches auth/private endpoints. The current cache
  version is `v7`.
- `public/index.html` registers the worker only outside localhost.
  `vercel.json` serves the worker with `Cache-Control: no-cache` and
  `Service-Worker-Allowed: /`.

When you change the precache list or caching strategy, bump `VERSION` in
`public/service-worker.js`; old caches are deleted on activation.

---

## 6. Production constraints and troubleshooting

### Request body size (4.5 MB)

Vercel limits serverless request bodies to 4.5 MB. Payment proofs are capped at
**4 MB** and show a validation error above that. Media uploads that use
multipart through the API are subject to the same platform limit. Large course
videos should be added as YouTube/external URLs, or uploaded directly to
Cloudinary in a future change. (Direct-to-Cloudinary signed uploads are the
recommended path if 100 MB browser uploads are required.)

### Cold starts and Neon

- First request after idle can take several seconds while Neon wakes.
- The function caches the Nest instance across warm invocations.
- `maxDuration` is 60 s and memory is 1024 MB in `backend/vercel.json`.
- If serverless limits or cold starts become a problem, deploy the same
  `backend/` directory as a long-running Node service (Render, Railway, Fly.io)
  with:
  - Build: `npm install && npm run vercel-build`
  - Start: `node dist/main`
  - Health check: `/api/health`
  Then point `REACT_APP_API_URL` at that service.

### Email

`onboarding@resend.dev` only delivers to the Resend account owner. Verify a
domain in Resend and set `EMAIL_FROM` to an address on that domain before
relying on password resets, invitations, payment notifications, or
certificates.

### Paystack webhook

Register `https://<backend>.vercel.app/api/payments/paystack/webhook` in the
Paystack dashboard. The API keeps the raw body (`rawBody: true`) so the
signature verifies. Bank-transfer approval works without Paystack.

### Prisma engine / function size

If a deployment fails while tracing Prisma, confirm `includeFiles` in
`backend/vercel.json` still lists `node_modules/.prisma/client/**`,
`node_modules/@prisma/client/**`, `node_modules/@prisma/engines/**`, and
`prisma/schema.prisma`. `rhel-openssl-3.0.x` must stay in the generator block.

### Disabled accounts

Disabling a user sets `isActive=false`; the next heartbeat returns `401` and
the client clears the session immediately. Refresh tokens for disabled users
are rejected as well.

---

## 7. Local production parity

```bash
# API
cd backend
npm run vercel-build
PORT=5001 node dist/main          # or: node dist/main

# Frontend
cd ..
CI=true npm run build
npx serve -s build -l 5050
```

The local preview at `http://localhost:5050` is already allowed by the
development CORS list. Service workers are intentionally disabled on
localhost by `public/index.html`; register `/service-worker.js` manually in
devtools if you need to test caching locally.

Verified in this workspace:

- `npm run vercel-build` in `backend/`
- compiled `api/index.js` served `/api/health`, `/api/auth/login`, and
  `/api/courses` locally with `VERCEL=1`
- `CI=true npm run build` for the frontend
- PWA registration, precache, manifest/icons, and full offline navigation
- responsive audit at 390×844, 768×1024, and 1440×900 across public, student,
  and admin pages (no horizontal overflow, no runtime exceptions)
### SEO / social preview prerender
The frontend `npm run build` now runs `scripts/prerender-meta.js` afterwards. It
fetches public content from `REACT_APP_API_URL` and writes one static HTML file
per public detail route (mentors, courses, blog, jobs, talent) with that item's
own Open Graph image, title, description and structured data. Social crawlers
read this raw HTML, so it is required for correct share previews.

- Deploy the backend first, or make sure `REACT_APP_API_URL` points to a live
  backend during the frontend build. If the API is unreachable the build still
  succeeds, but share previews fall back to the generic site image.
- Re-run the frontend build/deploy when you add new public content so its
  preview page is generated.
- `vercel.json` keeps the SPA rewrite as a fallback; Vercel serves the
  prerendered files at their matching paths automatically.
