-- Add the job application fields that were added to schema.prisma without a
-- migration. Without this, `prisma migrate deploy` produces a database that
-- breaks the jobs API at runtime.
ALTER TABLE "Job" ADD COLUMN "applicationsOpen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Job" ADD COLUMN "externalUrl" TEXT;
