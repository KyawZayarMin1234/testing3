-- AlterTable
ALTER TABLE "next_auth"."users" ADD COLUMN     "verificationCode" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;
