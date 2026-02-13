-- AlterTable
ALTER TABLE "User" ADD COLUMN "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "phoneOtp" TEXT,
ADD COLUMN "phoneOtpExpiry" TIMESTAMP(3);
