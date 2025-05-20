-- AlterTable
ALTER TABLE "RoseMembership" ADD COLUMN     "mysteryOrderIndex" INTEGER;

-- CreateIndex
CREATE INDEX "RoseMembership_roseId_mysteryOrderIndex_idx" ON "RoseMembership"("roseId", "mysteryOrderIndex");
