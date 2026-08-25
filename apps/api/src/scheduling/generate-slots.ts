import {
  dayOfWeekInTimeZone,
  parseHm,
  zonedWallTimeToUtc,
} from '../common/datetime';

export interface BusyRange {
  startsAt: Date;
  endsAt: Date;
}

export interface SlotWindow {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function rangesOverlap(left: BusyRange, right: BusyRange) {
  return left.startsAt < right.endsAt && left.endsAt > right.startsAt;
}

export function generateSlotsForDate(input: {
  isoDate: string;
  timeZone: string;
  windows: SlotWindow[];
  durationMinutes: number;
  bufferMinutes: number;
  minNoticeAt: Date;
  busy: BusyRange[];
  blocked: boolean;
}) {
  if (input.blocked) {
    return [];
  }

  const dayOfWeek = dayOfWeekInTimeZone(input.isoDate, input.timeZone);
  const windows = input.windows.filter((window) => window.dayOfWeek === dayOfWeek);
  const step = input.durationMinutes + input.bufferMinutes;
  const slots: BusyRange[] = [];

  for (const window of windows) {
    const start = parseHm(window.startTime).totalMinutes;
    const end = parseHm(window.endTime).totalMinutes;

    for (
      let minutes = start;
      minutes + input.durationMinutes <= end;
      minutes += step
    ) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const startsAt = zonedWallTimeToUtc(input.timeZone, input.isoDate, hours, mins);
      const endsAt = new Date(startsAt.getTime() + input.durationMinutes * 60 * 1000);
      const slot = { startsAt, endsAt };

      if (startsAt < input.minNoticeAt) {
        continue;
      }

      if (input.busy.some((busy) => rangesOverlap(slot, busy))) {
        continue;
      }

      slots.push(slot);
    }
  }

  return slots;
}
