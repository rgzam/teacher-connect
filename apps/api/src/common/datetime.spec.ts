import { calendarDateInTimeZone, dayRangeUtc, zonedWallTimeToUtc } from './datetime';

describe('datetime helpers', () => {
  it('converts a Denver wall time to the matching UTC instant', () => {
    const utc = zonedWallTimeToUtc('America/Denver', '2026-08-19', 15, 30);

    expect(
      utc.toLocaleString('en-US', {
        timeZone: 'America/Denver',
        hour: 'numeric',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    ).toMatch(/15:30/);
  });

  it('builds a full local day range that does not include the next midnight', () => {
    const { start, end } = dayRangeUtc('America/Denver', '2026-08-19');

    expect(start < end).toBe(true);
    expect(calendarDateInTimeZone('America/Denver', start).iso).toBe('2026-08-19');
    expect(calendarDateInTimeZone('America/Denver', new Date(end.getTime() - 1)).iso).toBe(
      '2026-08-19',
    );
  });
});
