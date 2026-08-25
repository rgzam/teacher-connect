export function mapFreeBusyPeriods(
  periods: Array<{ start?: string | null; end?: string | null }>,
) {
  return periods
    .filter((period) => period.start && period.end)
    .map((period) => ({
      startsAt: new Date(period.start as string),
      endsAt: new Date(period.end as string),
    }))
    .filter((period) => period.startsAt < period.endsAt);
}
