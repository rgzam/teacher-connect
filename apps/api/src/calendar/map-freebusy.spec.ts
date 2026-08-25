import { mapFreeBusyPeriods } from './map-freebusy';

describe('mapFreeBusyPeriods', () => {
  it('keeps only complete busy ranges and drops event titles', () => {
    const ranges = mapFreeBusyPeriods([
      { start: '2026-08-20T21:30:00.000Z', end: '2026-08-20T22:00:00.000Z' },
      { start: null, end: '2026-08-20T23:00:00.000Z' },
    ]);

    expect(ranges).toHaveLength(1);
    expect(ranges[0].startsAt.toISOString()).toBe('2026-08-20T21:30:00.000Z');
    expect(ranges[0]).not.toHaveProperty('summary');
  });
});
