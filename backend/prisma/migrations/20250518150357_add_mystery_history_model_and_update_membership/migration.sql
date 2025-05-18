/*
  Warnings:

  - You are about to drop the column `assignedMystery` on the `RoseMembership` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "RoseMembership" DROP COLUMN "assignedMystery",
ADD COLUMN     "currentAssignedMystery" TEXT;

-- CreateTable
CREATE TABLE "AssignedMysteryHistory" (
    "id" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "mystery" TEXT NOT NULL,
    "assignedMonth" INTEGER NOT NULL,
    "assignedYear" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignedMysteryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignedMysteryHistory_membershipId_idx" ON "AssignedMysteryHistory"("membershipId");

-- AddForeignKey
ALTER TABLE "AssignedMysteryHistory" ADD CONSTRAINT "AssignedMysteryHistory_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "RoseMembership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
