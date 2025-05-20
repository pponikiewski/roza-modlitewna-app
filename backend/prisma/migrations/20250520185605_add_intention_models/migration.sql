-- DropForeignKey
ALTER TABLE "RoseMembership" DROP CONSTRAINT "RoseMembership_roseId_fkey";

-- DropForeignKey
ALTER TABLE "RoseMembership" DROP CONSTRAINT "RoseMembership_userId_fkey";

-- CreateTable
CREATE TABLE "RoseMainIntention" (
    "id" TEXT NOT NULL,
    "roseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "RoseMainIntention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIntention" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isSharedWithRose" BOOLEAN NOT NULL DEFAULT false,
    "sharedWithRoseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIntention_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoseMainIntention_roseId_idx" ON "RoseMainIntention"("roseId");

-- CreateIndex
CREATE INDEX "RoseMainIntention_authorId_idx" ON "RoseMainIntention"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "RoseMainIntention_roseId_month_year_key" ON "RoseMainIntention"("roseId", "month", "year");

-- CreateIndex
CREATE INDEX "UserIntention_authorId_idx" ON "UserIntention"("authorId");

-- CreateIndex
CREATE INDEX "UserIntention_sharedWithRoseId_idx" ON "UserIntention"("sharedWithRoseId");

-- AddForeignKey
ALTER TABLE "RoseMembership" ADD CONSTRAINT "RoseMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseMembership" ADD CONSTRAINT "RoseMembership_roseId_fkey" FOREIGN KEY ("roseId") REFERENCES "Rose"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseMainIntention" ADD CONSTRAINT "RoseMainIntention_roseId_fkey" FOREIGN KEY ("roseId") REFERENCES "Rose"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseMainIntention" ADD CONSTRAINT "RoseMainIntention_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIntention" ADD CONSTRAINT "UserIntention_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserIntention" ADD CONSTRAINT "UserIntention_sharedWithRoseId_fkey" FOREIGN KEY ("sharedWithRoseId") REFERENCES "Rose"("id") ON DELETE SET NULL ON UPDATE CASCADE;
