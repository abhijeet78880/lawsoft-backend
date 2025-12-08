/*
  Warnings:

  - A unique constraint covering the columns `[appointmentId]` on the table `cases` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "cases_appointmentId_key" ON "cases"("appointmentId");
