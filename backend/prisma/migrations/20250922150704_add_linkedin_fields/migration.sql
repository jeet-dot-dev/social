-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "linkedinAccessToken" TEXT,
ADD COLUMN     "linkedinConnected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "linkedinRefreshToken" TEXT,
ADD COLUMN     "linkedinTokenExpiry" TIMESTAMP(3);
