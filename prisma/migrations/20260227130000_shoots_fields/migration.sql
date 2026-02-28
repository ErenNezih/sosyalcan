-- AlterTable
ALTER TABLE "Project" ADD COLUMN "endAt" TIMESTAMP(3),
ADD COLUMN "shootType" TEXT NOT NULL DEFAULT 'video',
ADD COLUMN "location" TEXT,
ADD COLUMN "assigneeId" TEXT;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
