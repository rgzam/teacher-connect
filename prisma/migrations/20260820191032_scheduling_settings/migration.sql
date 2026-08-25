-- DropIndex
DROP INDEX "Appointment_teacherId_startsAt_key";

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "bufferMinutes" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "maxBookingDays" INTEGER NOT NULL DEFAULT 14,
ADD COLUMN     "minNoticeHours" INTEGER NOT NULL DEFAULT 12;
