DO $$ BEGIN
  CREATE TYPE "InvitationAccessType" AS ENUM ('FREE', 'PAID');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InvitationStatus" AS ENUM ('PENDING_PAYMENT', 'ACCEPTED', 'DECLINED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "CourseInvitation" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "accessType" "InvitationAccessType" NOT NULL DEFAULT 'FREE',
  "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "message" TEXT,
  "paymentId" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CourseInvitation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CourseInvitation_courseId_idx" ON "CourseInvitation"("courseId");
CREATE INDEX IF NOT EXISTS "CourseInvitation_userId_idx" ON "CourseInvitation"("userId");
CREATE INDEX IF NOT EXISTS "CourseInvitation_status_idx" ON "CourseInvitation"("status");
CREATE INDEX IF NOT EXISTS "CourseInvitation_invitedById_idx" ON "CourseInvitation"("invitedById");
CREATE INDEX IF NOT EXISTS "CourseInvitation_email_idx" ON "CourseInvitation"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "CourseInvitation_paymentId_key" ON "CourseInvitation"("paymentId");

DO $$ BEGIN
  ALTER TABLE "CourseInvitation"
    ADD CONSTRAINT "CourseInvitation_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseInvitation"
    ADD CONSTRAINT "CourseInvitation_invitedById_fkey"
    FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseInvitation"
    ADD CONSTRAINT "CourseInvitation_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseInvitation"
    ADD CONSTRAINT "CourseInvitation_paymentId_fkey"
    FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
