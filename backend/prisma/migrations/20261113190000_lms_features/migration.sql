-- TweackTech LMS: instructors, chat, quizzes, payments, talent hub,
-- notifications and currency conversion.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "ChatRoomType" AS ENUM ('COURSE', 'DIRECT', 'GROUP', 'SUPPORT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ChatMemberRole" AS ENUM ('MEMBER', 'MODERATOR', 'OWNER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QuizQuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('SYSTEM', 'PAYMENT', 'CERTIFICATE', 'ASSIGNMENT', 'SESSION', 'CHAT', 'ACCOUNT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_APPROVAL';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

-- ---------------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------------
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "disabledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "disabledReason" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- Module / Lesson scheduled unlocking
-- ---------------------------------------------------------------------------
ALTER TABLE "Module"
  ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "unlockAfterDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "unlockAt" TIMESTAMP(3);

ALTER TABLE "Lesson"
  ADD COLUMN IF NOT EXISTS "unlockAfterDays" INTEGER,
  ADD COLUMN IF NOT EXISTS "unlockAt" TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- Payment: bank transfer proof + review + currency snapshot + Paystack
-- ---------------------------------------------------------------------------
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "baseAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "baseCurrency" TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS "exchangeRate" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "reference" TEXT,
  ADD COLUMN IF NOT EXISTS "proofUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "proofUploadedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "adminNote" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedById" TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "gatewayResponse" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Payment_reference_key" ON "Payment"("reference");
CREATE INDEX IF NOT EXISTS "Payment_reviewedById_idx" ON "Payment"("reviewedById");

DO $$ BEGIN
  ALTER TABLE "Payment"
    ADD CONSTRAINT "Payment_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Certificate / LiveSession
-- ---------------------------------------------------------------------------
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP(3);

ALTER TABLE "LiveSession"
  ADD COLUMN IF NOT EXISTS "reminderMinutesBefore" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "reminderSentAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "isCancelled" BOOLEAN NOT NULL DEFAULT false;

-- ---------------------------------------------------------------------------
-- Assignments: quiz support, auto-grading, creator relation
-- ---------------------------------------------------------------------------
ALTER TABLE "Assignment"
  ADD COLUMN IF NOT EXISTS "passScore" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "autoGrade" BOOLEAN NOT NULL DEFAULT false;

DO $$ BEGIN
  ALTER TABLE "Assignment"
    ADD CONSTRAINT "Assignment_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "AssignmentSubmission"
  ADD COLUMN IF NOT EXISTS "answers" TEXT,
  ADD COLUMN IF NOT EXISTS "quizResult" TEXT,
  ADD COLUMN IF NOT EXISTS "autoGraded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "attemptCount" INTEGER NOT NULL DEFAULT 1;

-- ---------------------------------------------------------------------------
-- CourseInstructor
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "CourseInstructor" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'CO_INSTRUCTOR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "CourseInstructor_courseId_userId_key" ON "CourseInstructor"("courseId", "userId");
CREATE INDEX IF NOT EXISTS "CourseInstructor_courseId_idx" ON "CourseInstructor"("courseId");
CREATE INDEX IF NOT EXISTS "CourseInstructor_userId_idx" ON "CourseInstructor"("userId");

DO $$ BEGIN
  ALTER TABLE "CourseInstructor"
    ADD CONSTRAINT "CourseInstructor_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "CourseInstructor"
    ADD CONSTRAINT "CourseInstructor_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Chat
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ChatRoom" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "type" "ChatRoomType" NOT NULL DEFAULT 'GROUP',
  "courseId" TEXT,
  "createdById" TEXT,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "lastMessageAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChatRoom_courseId_idx" ON "ChatRoom"("courseId");
CREATE INDEX IF NOT EXISTS "ChatRoom_type_idx" ON "ChatRoom"("type");
CREATE INDEX IF NOT EXISTS "ChatRoom_lastMessageAt_idx" ON "ChatRoom"("lastMessageAt");
CREATE UNIQUE INDEX IF NOT EXISTS "ChatRoom_courseId_type_key" ON "ChatRoom"("courseId", "type");

DO $$ BEGIN
  ALTER TABLE "ChatRoom"
    ADD CONSTRAINT "ChatRoom_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatRoom"
    ADD CONSTRAINT "ChatRoom_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ChatRoomMember" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "ChatMemberRole" NOT NULL DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastReadAt" TIMESTAMP(3),
  CONSTRAINT "ChatRoomMember_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ChatRoomMember_roomId_userId_key" ON "ChatRoomMember"("roomId", "userId");
CREATE INDEX IF NOT EXISTS "ChatRoomMember_userId_idx" ON "ChatRoomMember"("userId");
CREATE INDEX IF NOT EXISTS "ChatRoomMember_roomId_idx" ON "ChatRoomMember"("roomId");

DO $$ BEGIN
  ALTER TABLE "ChatRoomMember"
    ADD CONSTRAINT "ChatRoomMember_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatRoomMember"
    ADD CONSTRAINT "ChatRoomMember_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "ChatMessage" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachmentUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");
CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_roomId_fkey"
    FOREIGN KEY ("roomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatMessage"
    ADD CONSTRAINT "ChatMessage_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Quizzes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "QuizQuestion" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "prompt" TEXT NOT NULL,
  "type" "QuizQuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
  "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0,
  "explanation" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "QuizQuestion_assignmentId_order_idx" ON "QuizQuestion"("assignmentId", "order");

DO $$ BEGIN
  ALTER TABLE "QuizQuestion"
    ADD CONSTRAINT "QuizQuestion_assignmentId_fkey"
    FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "QuizOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "isCorrect" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "QuizOption_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "QuizOption_questionId_order_idx" ON "QuizOption"("questionId", "order");

DO $$ BEGIN
  ALTER TABLE "QuizOption"
    ADD CONSTRAINT "QuizOption_questionId_fkey"
    FOREIGN KEY ("questionId") REFERENCES "QuizQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
  "title" TEXT NOT NULL,
  "body" TEXT,
  "link" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Currency & bank accounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "CurrencyRate" (
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "rateFromUsd" DOUBLE PRECISION NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("code")
);
CREATE INDEX IF NOT EXISTS "CurrencyRate_isActive_idx" ON "CurrencyRate"("isActive");

CREATE TABLE IF NOT EXISTS "BankAccount" (
  "id" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountName" TEXT NOT NULL,
  "accountNumber" TEXT NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "branch" TEXT,
  "instructions" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "BankAccount_currency_idx" ON "BankAccount"("currency");
CREATE INDEX IF NOT EXISTS "BankAccount_isActive_idx" ON "BankAccount"("isActive");

-- ---------------------------------------------------------------------------
-- Talent hub
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "TalentProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "headline" TEXT NOT NULL,
  "bio" TEXT,
  "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "experienceYears" INTEGER,
  "hourlyRate" DOUBLE PRECISION,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "availability" TEXT NOT NULL DEFAULT 'Available',
  "location" TEXT,
  "avatar" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TalentProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TalentProfile_userId_key" ON "TalentProfile"("userId");
CREATE INDEX IF NOT EXISTS "TalentProfile_isPublished_idx" ON "TalentProfile"("isPublished");
CREATE INDEX IF NOT EXISTS "TalentProfile_isFeatured_idx" ON "TalentProfile"("isFeatured");
CREATE INDEX IF NOT EXISTS "TalentProfile_availability_idx" ON "TalentProfile"("availability");

DO $$ BEGIN
  ALTER TABLE "TalentProfile"
    ADD CONSTRAINT "TalentProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- Email log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "EmailLog" (
  "id" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "providerId" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "EmailLog_to_idx" ON "EmailLog"("to");
CREATE INDEX IF NOT EXISTS "EmailLog_createdAt_idx" ON "EmailLog"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailLog_status_idx" ON "EmailLog"("status");
