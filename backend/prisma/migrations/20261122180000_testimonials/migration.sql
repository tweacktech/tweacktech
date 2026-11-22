CREATE TABLE IF NOT EXISTS "Testimonial" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" TEXT,
  "name" TEXT NOT NULL,
  "headline" TEXT,
  "content" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "avatar" TEXT,
  "isVisible" BOOLEAN NOT NULL DEFAULT false,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Testimonial_isVisible_isFeatured_idx" ON "Testimonial"("isVisible", "isFeatured");
CREATE INDEX IF NOT EXISTS "Testimonial_userId_idx" ON "Testimonial"("userId");

DO $$ BEGIN
  ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
