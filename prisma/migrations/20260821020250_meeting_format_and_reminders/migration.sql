-- CreateEnum
CREATE TYPE "MeetingFormat" AS ENUM ('VIRTUAL', 'HOME_VISIT');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "homeVisitAddress" TEXT,
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ADD COLUMN     "virtualMeetingName" TEXT;

-- AlterTable
ALTER TABLE "AppointmentType" ADD COLUMN     "format" "MeetingFormat" NOT NULL DEFAULT 'VIRTUAL';
