-- Create enums
CREATE TYPE "RoleName" AS ENUM ('ORGANIZER', 'LEADER', 'NAVIGATOR');
CREATE TYPE "TeamStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED');
CREATE TYPE "GoalStatus" AS ENUM ('SELECTED', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'ACHIEVED');
CREATE TYPE "SpecialtyStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE "SpecialtyLevelName" AS ENUM ('BRONZE', 'SILVER', 'GOLD');
CREATE TYPE "SpecialtyResourceType" AS ENUM ('VIDEO', 'MATERIAL');
CREATE TYPE "NotificationScope" AS ENUM ('ALL', 'TEAM');
CREATE TYPE "ChatMessageType" AS ENUM ('USER', 'SYSTEM');
CREATE TYPE "AppealStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'CLOSED');
CREATE TYPE "AgeStatus" AS ENUM ('SCOUT', 'NAVIGATOR', 'NOVATOR', 'WANDERER');
CREATE TYPE "AchievementStage" AS ENUM ('START', 'PATH', 'TRAIL', 'ROUTE', 'EXPEDITION', 'SUCCESS');

-- Create tables
CREATE TABLE "Role" (
  "id" TEXT NOT NULL,
  "name" "RoleName" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "institution" TEXT NOT NULL,
  "status" "TeamStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "middleName" TEXT,
  "birthDate" TIMESTAMP(3) NOT NULL,
  "email" TEXT,
  "passwordHash" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
  "roleId" TEXT NOT NULL,
  "teamId" TEXT,
  "approvedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastLoginAt" TIMESTAMP(3),
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Sphere" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Sphere_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Competency" (
  "id" TEXT NOT NULL,
  "sphereId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Goal" (
  "id" TEXT NOT NULL,
  "competencyId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalActivity" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  CONSTRAINT "GoalActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalSelection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "selectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "nextEligibleAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoalSelection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserGoal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "selectionId" TEXT NOT NULL,
  "status" "GoalStatus" NOT NULL DEFAULT 'SELECTED',
  "comment" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "confirmedById" TEXT,
  "achievedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalProgress" (
  "id" TEXT NOT NULL,
  "userGoalId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoalProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GoalReaction" (
  "id" TEXT NOT NULL,
  "userGoalId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoalReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Area" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Specialty" (
  "id" TEXT NOT NULL,
  "areaId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpecialtyLevel" (
  "id" TEXT NOT NULL,
  "specialtyId" TEXT NOT NULL,
  "name" "SpecialtyLevelName" NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SpecialtyLevel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpecialtyResource" (
  "id" TEXT NOT NULL,
  "specialtyId" TEXT NOT NULL,
  "type" "SpecialtyResourceType" NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  CONSTRAINT "SpecialtyResource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SpecialtyChecklistItem" (
  "id" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "SpecialtyChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSpecialty" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "specialtyId" TEXT NOT NULL,
  "levelId" TEXT NOT NULL,
  "status" "SpecialtyStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "confirmedAt" TIMESTAMP(3),
  "confirmedById" TEXT,
  CONSTRAINT "UserSpecialty_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserSpecialtyChecklist" (
  "id" TEXT NOT NULL,
  "userSpecialtyId" TEXT NOT NULL,
  "checklistItemId" TEXT NOT NULL,
  "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSpecialtyChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Achievement" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "ageStatus" "AgeStatus" NOT NULL,
  "stage" "AchievementStage" NOT NULL,
  "goalsAchievedCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Announcement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" TEXT NOT NULL,
  CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "scope" "NotificationScope" NOT NULL DEFAULT 'ALL',
  "teamId" TEXT,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationReceipt" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  CONSTRAINT "NotificationReceipt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatMessage" (
  "id" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "userId" TEXT,
  "type" "ChatMessageType" NOT NULL DEFAULT 'USER',
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChatReaction" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reaction" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChatReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnonymousNote" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnonymousNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Appeal" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "teamId" TEXT,
  "subject" TEXT NOT NULL,
  "status" "AppealStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Appeal_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppealMessage" (
  "id" TEXT NOT NULL,
  "appealId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppealMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "data" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Unique indexes
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "GoalReaction_userGoalId_userId_key" ON "GoalReaction"("userGoalId", "userId");
CREATE UNIQUE INDEX "UserSpecialtyChecklist_userSpecialtyId_checklistItemId_key" ON "UserSpecialtyChecklist"("userSpecialtyId", "checklistItemId");
CREATE UNIQUE INDEX "Achievement_userId_key" ON "Achievement"("userId");
CREATE UNIQUE INDEX "NotificationReceipt_notificationId_userId_key" ON "NotificationReceipt"("notificationId", "userId");
CREATE UNIQUE INDEX "ChatReaction_messageId_userId_reaction_key" ON "ChatReaction"("messageId", "userId", "reaction");

-- Secondary indexes
CREATE INDEX "UserGoal_userId_status_idx" ON "UserGoal"("userId", "status");
CREATE INDEX "UserSpecialty_userId_status_idx" ON "UserSpecialty"("userId", "status");

-- Foreign keys
ALTER TABLE "Team" ADD CONSTRAINT "Team_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Competency" ADD CONSTRAINT "Competency_sphereId_fkey" FOREIGN KEY ("sphereId") REFERENCES "Sphere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoalActivity" ADD CONSTRAINT "GoalActivity_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoalSelection" ADD CONSTRAINT "GoalSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_selectionId_fkey" FOREIGN KEY ("selectionId") REFERENCES "GoalSelection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserGoal" ADD CONSTRAINT "UserGoal_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GoalProgress" ADD CONSTRAINT "GoalProgress_userGoalId_fkey" FOREIGN KEY ("userGoalId") REFERENCES "UserGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoalReaction" ADD CONSTRAINT "GoalReaction_userGoalId_fkey" FOREIGN KEY ("userGoalId") REFERENCES "UserGoal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GoalReaction" ADD CONSTRAINT "GoalReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Specialty" ADD CONSTRAINT "Specialty_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecialtyLevel" ADD CONSTRAINT "SpecialtyLevel_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecialtyResource" ADD CONSTRAINT "SpecialtyResource_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SpecialtyChecklistItem" ADD CONSTRAINT "SpecialtyChecklistItem_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "SpecialtyLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSpecialty" ADD CONSTRAINT "UserSpecialty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSpecialty" ADD CONSTRAINT "UserSpecialty_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSpecialty" ADD CONSTRAINT "UserSpecialty_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "SpecialtyLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSpecialty" ADD CONSTRAINT "UserSpecialty_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserSpecialtyChecklist" ADD CONSTRAINT "UserSpecialtyChecklist_userSpecialtyId_fkey" FOREIGN KEY ("userSpecialtyId") REFERENCES "UserSpecialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserSpecialtyChecklist" ADD CONSTRAINT "UserSpecialtyChecklist_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "SpecialtyChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationReceipt" ADD CONSTRAINT "NotificationReceipt_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "NotificationReceipt" ADD CONSTRAINT "NotificationReceipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChatReaction" ADD CONSTRAINT "ChatReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChatReaction" ADD CONSTRAINT "ChatReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AnonymousNote" ADD CONSTRAINT "AnonymousNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appeal" ADD CONSTRAINT "Appeal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppealMessage" ADD CONSTRAINT "AppealMessage_appealId_fkey" FOREIGN KEY ("appealId") REFERENCES "Appeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AppealMessage" ADD CONSTRAINT "AppealMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
