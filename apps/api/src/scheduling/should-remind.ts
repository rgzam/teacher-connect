const ONE_HOUR_MS = 60 * 60 * 1000;

export function shouldSendReminder(
  startsAt: Date,
  now: Date,
  reminderSentAt: Date | null,
) {
  if (reminderSentAt) {
    return false;
  }

  return startsAt > now && startsAt.getTime() <= now.getTime() + ONE_HOUR_MS;
}
