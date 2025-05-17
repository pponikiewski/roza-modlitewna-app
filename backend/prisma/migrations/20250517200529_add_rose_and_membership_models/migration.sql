/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "Rose" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "zelatorId" TEXT NOT NULL,

    CONSTRAINT "Rose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoseMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "assignedMystery" TEXT,

    CONSTRAINT "RoseMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoseMembership_userId_roseId_key" ON "RoseMembership"("userId", "roseId");

-- AddForeignKey
ALTER TABLE "Rose" ADD CONSTRAINT "Rose_zelatorId_fkey" FOREIGN KEY ("zelatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseMembership" ADD CONSTRAINT "RoseMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseMembership" ADD CONSTRAINT "RoseMembership_roseId_fkey" FOREIGN KEY ("roseId") REFERENCES "Rose"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
