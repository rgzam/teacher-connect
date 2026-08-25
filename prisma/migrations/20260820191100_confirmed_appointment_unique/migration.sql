-- Only one confirmed appointment may occupy a teacher start time.
-- Cancelled rows stay in history and do not block the slot.
CREATE UNIQUE INDEX "Appointment_teacherId_startsAt_confirmed_key"
ON "Appointment" ("teacherId", "startsAt")
WHERE status = 'CONFIRMED';
