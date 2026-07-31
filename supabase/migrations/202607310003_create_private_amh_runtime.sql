-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "amh";

-- CreateEnum
CREATE TYPE "amh"."Role" AS ENUM ('ADMIN', 'RECRUITER');

-- CreateEnum
CREATE TYPE "amh"."LeadStatus" AS ENUM ('SEARCH_RESULT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'DUPLICATE', 'CONTACT_READY', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'NO_RESPONSE', 'SCREENING', 'APPLICATION_SUBMITTED', 'INTERVIEW_REVIEW', 'ARCHIVED', 'DO_NOT_CONTACT');

-- CreateEnum
CREATE TYPE "amh"."Classification" AS ENUM ('ASPIRING_HELPER', 'EMPLOYER', 'RECRUITMENT_AGENCY', 'UNRELATED', 'UNCLEAR');

-- CreateTable
CREATE TABLE "amh"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "amh"."Role" NOT NULL DEFAULT 'RECRUITER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amh"."SearchRun" (
    "id" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "dateRange" TEXT NOT NULL,
    "generatedQueries" TEXT NOT NULL,
    "resultsFound" INTEGER NOT NULL DEFAULT 0,
    "qualifiedResults" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "finishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amh"."Lead" (
    "id" TEXT NOT NULL,
    "publicDisplayName" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourcePostTitle" TEXT NOT NULL,
    "sourcePostExcerpt" TEXT NOT NULL,
    "sourcePublishedAt" TIMESTAMP(3) NOT NULL,
    "detectedCountry" TEXT,
    "detectedDestination" TEXT,
    "detectedExperience" TEXT,
    "detectedSkills" TEXT NOT NULL DEFAULT '[]',
    "detectedLanguage" TEXT,
    "classification" "amh"."Classification" NOT NULL,
    "explicitJobIntent" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" INTEGER NOT NULL,
    "aiSummary" TEXT NOT NULL,
    "riskFlags" TEXT NOT NULL DEFAULT '[]',
    "status" "amh"."LeadStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "assignedRecruiterId" TEXT,
    "searchRunId" TEXT,
    "registrationToken" TEXT NOT NULL,
    "consentToContinue" BOOLEAN NOT NULL DEFAULT false,
    "doNotContact" BOOLEAN NOT NULL DEFAULT false,
    "possibleDuplicateId" TEXT,
    "internalNote" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "contactedAt" TIMESTAMP(3),
    "registeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amh"."OutreachMessage" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "messageText" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "simulatedResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amh"."ScreeningSession" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'English',
    "currentQuestion" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "pausedForHuman" BOOLEAN NOT NULL DEFAULT false,
    "summary" TEXT,
    "recommendedNextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ScreeningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amh"."ScreeningAnswer" (
    "id" TEXT NOT NULL,
    "screeningSessionId" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScreeningAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amh"."TestApplication" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "contactMethod" TEXT NOT NULL,
    "contactValue" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "overseasExperience" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "availability" TEXT NOT NULL,
    "preferredLanguage" TEXT NOT NULL,
    "consentAccepted" BOOLEAN NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amh"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "leadId" TEXT,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "amh"."User"("email");

-- CreateIndex
CREATE INDEX "SearchRun_createdAt_idx" ON "amh"."SearchRun"("createdAt");
CREATE INDEX "SearchRun_createdById_idx" ON "amh"."SearchRun"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_sourceUrl_key" ON "amh"."Lead"("sourceUrl");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_registrationToken_key" ON "amh"."Lead"("registrationToken");

-- CreateIndex
CREATE INDEX "Lead_status_discoveredAt_idx" ON "amh"."Lead"("status", "discoveredAt");

-- CreateIndex
CREATE INDEX "Lead_classification_confidenceScore_idx" ON "amh"."Lead"("classification", "confidenceScore");

-- CreateIndex
CREATE INDEX "Lead_assignedRecruiterId_idx" ON "amh"."Lead"("assignedRecruiterId");
CREATE INDEX "Lead_searchRunId_idx" ON "amh"."Lead"("searchRunId");

-- CreateIndex
CREATE INDEX "OutreachMessage_leadId_idx" ON "amh"."OutreachMessage"("leadId");

-- CreateIndex
CREATE INDEX "ScreeningSession_leadId_idx" ON "amh"."ScreeningSession"("leadId");
CREATE INDEX "ScreeningAnswer_screeningSessionId_idx" ON "amh"."ScreeningAnswer"("screeningSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TestApplication_leadId_key" ON "amh"."TestApplication"("leadId");

-- CreateIndex
CREATE INDEX "TestApplication_submittedAt_idx" ON "amh"."TestApplication"("submittedAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "amh"."AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_leadId_idx" ON "amh"."AuditLog"("leadId");
CREATE INDEX "AuditLog_userId_idx" ON "amh"."AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "amh"."SearchRun" ADD CONSTRAINT "SearchRun_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "amh"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."Lead" ADD CONSTRAINT "Lead_assignedRecruiterId_fkey" FOREIGN KEY ("assignedRecruiterId") REFERENCES "amh"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."Lead" ADD CONSTRAINT "Lead_searchRunId_fkey" FOREIGN KEY ("searchRunId") REFERENCES "amh"."SearchRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."OutreachMessage" ADD CONSTRAINT "OutreachMessage_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "amh"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."ScreeningSession" ADD CONSTRAINT "ScreeningSession_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "amh"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."ScreeningAnswer" ADD CONSTRAINT "ScreeningAnswer_screeningSessionId_fkey" FOREIGN KEY ("screeningSessionId") REFERENCES "amh"."ScreeningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."TestApplication" ADD CONSTRAINT "TestApplication_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "amh"."Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "amh"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amh"."AuditLog" ADD CONSTRAINT "AuditLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "amh"."Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- The Express API connects as a server-side database role. Keep this private
-- schema unavailable through Supabase's public Data API roles.
REVOKE ALL ON SCHEMA "amh" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA "amh" FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "amh" FROM PUBLIC, anon, authenticated;
