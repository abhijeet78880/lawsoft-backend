-- CreateEnum
CREATE TYPE "DisputeResolutionMethod" AS ENUM ('TRIAL', 'MEDIATION', 'ARBITRATION');

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "disputeResolutionMethod" "DisputeResolutionMethod";
