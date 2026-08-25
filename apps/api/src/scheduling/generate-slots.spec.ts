import { generateSlotsForDate, rangesOverlap } from './generate-slots';

describe('generateSlotsForDate', () => {
  const timeZone = 'America/Denver';

  it('walks a window using duration plus buffer', () => {
    const slots = generateSlotsForDate({
      isoDate: '2026-08-20',
      timeZone,
      windows: [{ dayOfWeek: 4, startTime: '15:30', endTime: '16:30' }],
      durationMinutes: 20,
      bufferMinutes: 10,
      minNoticeAt: new Date('2026-08-01T00:00:00.000Z'),
      busy: [],
      blocked: false,
    });

    expect(slots).toHaveLength(2);
    expect(
      slots[0].startsAt.toLocaleString('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    ).toMatch(/15:30/);
  });

  it('hides a slot that overlaps an existing appointment', () => {
    const [first] = generateSlotsForDate({
      isoDate: '2026-08-20',
      timeZone,
      windows: [{ dayOfWeek: 4, startTime: '15:30', endTime: '17:00' }],
      durationMinutes: 20,
      bufferMinutes: 5,
      minNoticeAt: new Date('2026-08-01T00:00:00.000Z'),
      busy: [],
      blocked: false,
    });

    const remaining = generateSlotsForDate({
      isoDate: '2026-08-20',
      timeZone,
      windows: [{ dayOfWeek: 4, startTime: '15:30', endTime: '17:00' }],
      durationMinutes: 20,
      bufferMinutes: 5,
      minNoticeAt: new Date('2026-08-01T00:00:00.000Z'),
      busy: [first],
      blocked: false,
    });

    expect(remaining.some((slot) => slot.startsAt.getTime() === first.startsAt.getTime())).toBe(
      false,
    );
  });

  it('returns no slots on a blocked date', () => {
    expect(
      generateSlotsForDate({
        isoDate: '2026-08-20',
        timeZone,
        windows: [{ dayOfWeek: 4, startTime: '15:30', endTime: '17:00' }],
        durationMinutes: 20,
        bufferMinutes: 5,
        minNoticeAt: new Date('2026-08-01T00:00:00.000Z'),
        busy: [],
        blocked: true,
      }),
    ).toEqual([]);
  });
});

describe('rangesOverlap', () => {
  it('detects two parents picking the same start', () => {
    const start = new Date('2026-08-20T21:30:00.000Z');
    const end = new Date('2026-08-20T21:50:00.000Z');

    expect(rangesOverlap({ startsAt: start, endsAt: end }, { startsAt: start, endsAt: end })).toBe(
      true,
    );
  });
});
