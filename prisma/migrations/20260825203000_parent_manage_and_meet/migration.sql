-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN "manageToken" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "meetUrl" TEXT;

UPDATE "Appointment" SET "manageToken" = gen_random_uuid()::text WHERE "manageToken" IS NULL;

ALTER TABLE "Appointment" ALTER COLUMN "manageToken" SET NOT NULL;

CREATE UNIQUE INDEX "Appointment_manageToken_key" ON "Appointment"("manageToken");
