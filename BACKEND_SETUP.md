# TweackTech LMS Backend Setup Guide

## Prerequisites

- Node.js v22+
- PostgreSQL (Neon recommended: https://neon.com)
- Cloudinary account (https://cloudinary.com)

## Step 1: Install Backend Dependencies

```bash
cd /Users/user/Project/Learn/tweacktech/backend
npm install
```

> **Note:** If you don't have internet access, you'll need to connect to a network first, then run `npm install`.

## Step 2: Configure Environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@neon-host.neon.tech/dbname?sslmode=require"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
CORS_ORIGIN=http://localhost:3000
```

## Step 3: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

## Step 4: Seed the Database

```bash
npx ts-node src/seeders/run.seed.ts
```

This creates:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| SuperAdmin | meyorpop@gmail.com | password@123 | SUPERADMIN |
| Staff 1 | staff@tweacktech.com | password@123 | STAFF |
| Staff 2 | instructor@tweacktech.com | password@123 | STAFF |
| Student 1 | student@tweacktech.com | password@123 | STUDENT |
| Student 2 | dev@tweacktech.com | password@123 | STUDENT |

Also creates: 3 categories, 3 sample courses, enrollments, certificates, privacy policy, terms of service.

## Step 5: Start the Backend

```bash
npm run start:dev
```

Backend runs on `http://localhost:5000`
API docs: `http://localhost:5000/api/docs`

## Step 6: Connect Frontend

Create `frontend/.env` (or set in your React app):

```
REACT_APP_API_URL=http://localhost:5000/api
```

Then start the frontend:

```bash
cd /Users/user/Project/Learn/tweacktech
npm start
```

Frontend runs on `http://localhost:3000`

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user profile
- `PATCH /api/auth/profile` - Update profile
- `PATCH /api/auth/change-password` - Change password

### Courses
- `GET /api/courses` - List courses (with filters)
- `GET /api/courses/:id` - Get course detail
- `GET /api/courses/slug/:slug` - Get course by slug
- `POST /api/courses` - Create course (Admin/Staff)
- `PUT /api/courses/:id` - Update course (Admin/Staff)
- `DELETE /api/courses/:id` - Delete course (Admin)
- `POST /api/courses/:courseId/modules` - Add module
- `POST /api/courses/modules/:moduleId/lessons` - Add lesson

### Enrollments
- `POST /api/enrollments/enroll/:courseId` - Enroll in course
- `GET /api/enrollments/my` - My enrollments
- `GET /api/enrollments/:id` - Get enrollment detail
- `PATCH /api/enrollments/progress` - Update lesson progress

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/my` - My payments
- `GET /api/payments/revenue/stats` - Revenue stats (Admin)

### Certificates
- `POST /api/certificates/generate/:enrollmentId` - Generate certificate
- `GET /api/certificates/my` - My certificates
- `GET /api/certificates/verify/:code` - Verify certificate

### Blog
- `GET /api/blog` - List blog posts
- `GET /api/blog/:id` - Get blog post
- `GET /api/blog/slug/:slug` - Get blog post by slug
- `POST /api/blog` - Create post (Admin/Staff)
- `GET /api/blog/categories` - Get categories

### Support
- `POST /api/support/tickets` - Create ticket
- `GET /api/support/tickets/my` - My tickets
- `GET /api/support/tickets` - All tickets (Admin)
- `POST /api/support/tickets/:id/reply` - Reply to ticket

### Media (Cloudinary)
- `POST /api/media/upload` - Upload file
- `GET /api/media/my` - My uploads

## Role Permissions

| Role | Can Manage |
|------|-----------|
| SUPERADMIN | Everything |
| ADMIN | Courses, users, payments, certificates, blog, support |
| STAFF | Their own courses, modules, lessons |
| STUDENT | Enroll, view progress, download certificates |

## Tech Stack

- **Backend:** Nest.js, TypeScript, Prisma ORM, PostgreSQL (Neon)
- **Storage:** Cloudinary (images, videos, PDFs, slides)
- **Auth:** JWT (access + refresh tokens), bcrypt
- **Docs:** Swagger/OpenAPI at `/api/docs`

## File Structure

```
backend/
├── src/
│   ├── auth/              # Authentication (JWT, login, register)
│   ├── users/             # User management
│   ├── courses/           # Courses, modules, lessons
│   ├── enrollments/       # Student enrollments & progress
│   ├── payments/          # Payment processing
│   ├── certificates/      # Certificate generation & verification
│   ├── blog/              # Blog posts & categories
│   ├── support/           # Support ticket system
│   ├── media/             # Cloudinary file uploads
│   ├── seeders/           # Database seeders
│   ├── common/            # Guards, filters, interceptors, services
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma      # Database schema
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Monetization Features

- **Course Types:** FREE, PAID, PARTIAL (scholarship/discount)
- **Pricing:** Price, discount price, discount date ranges
- **Payment Tracking:** Transaction IDs, payment methods, status
- **Revenue Analytics:** Total revenue, monthly revenue, transaction counts
- **Enrollment Gating:** Paid courses require payment before enrollment

## Google AdSense Compliance

- Privacy Policy page at `/privacy`
- Terms of Service page at `/terms`
- Cookie consent ready
- No deceptive practices
- Clear contact information (tweackchech@gmail.com)

## Dark/Light Mode

- System preference detection
- Manual toggle (Light/Dark/System)
- Persists in localStorage
- Applied to entire app including Tailwind classes