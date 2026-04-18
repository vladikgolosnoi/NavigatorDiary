DO $$ BEGIN
  CREATE TYPE "PasswordResetRequestStatus" AS ENUM ('OPEN', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "PasswordResetRequest" (
    "id" TEXT NOT NULL,
    "loginHint" TEXT,
    "fullName" TEXT,
    "teamName" TEXT,
    "contact" TEXT NOT NULL,
    "note" TEXT,
    "status" "PasswordResetRequestStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedLogin" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PasswordResetRequest_status_createdAt_idx"
ON "PasswordResetRequest"("status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "PasswordResetRequest"
  ADD CONSTRAINT "PasswordResetRequest_resolvedById_fkey"
  FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
