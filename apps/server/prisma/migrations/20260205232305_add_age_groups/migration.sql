-- CreateTable
CREATE TABLE "AgeGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AgeGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgeGroup_name_key" ON "AgeGroup"("name");

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN "ageGroupId" TEXT;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ageGroupId_fkey" FOREIGN KEY ("ageGroupId") REFERENCES "AgeGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
