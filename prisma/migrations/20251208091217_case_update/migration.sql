-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "appointmentId" TEXT,
ADD COLUMN     "isAccepted" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
