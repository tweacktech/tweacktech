ALTER TABLE "Course"
  ADD COLUMN IF NOT EXISTS "enrollmentLocked" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "enrollmentLockedMessage" TEXT;
