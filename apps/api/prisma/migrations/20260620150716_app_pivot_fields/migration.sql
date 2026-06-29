-- CreateEnum
CREATE TYPE "SeekingGender" AS ENUM ('MALE', 'FEMALE', 'EVERYONE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "seekingGender" "SeekingGender" DEFAULT 'EVERYONE',
ALTER COLUMN "telegramId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

