/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ZELATOR', 'MEMBER');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

-- DropEnum
DROP TYPE "Role";
