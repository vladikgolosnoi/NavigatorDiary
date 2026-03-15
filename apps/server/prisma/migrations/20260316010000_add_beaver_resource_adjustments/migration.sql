DO $$ BEGIN
  CREATE TYPE "BeaverResourceType" AS ENUM ('ACORN', 'TWIG', 'LOG');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "BeaverResourceAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "resourceType" "BeaverResourceType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeaverResourceAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BeaverResourceAdjustment_userId_resourceType_idx"
ON "BeaverResourceAdjustment"("userId", "resourceType");

DO $$ BEGIN
  ALTER TABLE "BeaverResourceAdjustment"
  ADD CONSTRAINT "BeaverResourceAdjustment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BeaverResourceAdjustment"
  ADD CONSTRAINT "BeaverResourceAdjustment_organizerId_fkey"
  FOREIGN KEY ("organizerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
