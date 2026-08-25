export function calendarDateInTimeZone(timeZone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return {
    year,
    month,
    day,
    iso: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  };
}

export function dateOnlyUtc(isoDate: string) {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function addDaysIso(isoDate: string, days: number) {
  const date = dateOnlyUtc(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function zonedWallTimeToUtc(
  timeZone: string,
  isoDate: string,
  hours: number,
  minutes: number,
) {
  const wall = `${isoDate}T${pad(hours)}:${pad(minutes)}:00`;
  let utcMs = Date.parse(`${wall}Z`);

  for (let i = 0; i < 4; i += 1) {
    const shown = wallTimeInZone(new Date(utcMs), timeZone);
    utcMs += Date.parse(`${wall}Z`) - Date.parse(`${shown}Z`);
  }

  return new Date(utcMs);
}

export function parseHm(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
}

export function minutesToHm(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function dayOfWeekInTimeZone(isoDate: string, timeZone: string) {
  const noon = zonedWallTimeToUtc(timeZone, isoDate, 12, 0);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
  }).format(noon);
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days.indexOf(weekday);
}

export function dayRangeUtc(timeZone: string, isoDate: string) {
  const start = zonedWallTimeToUtc(timeZone, isoDate, 0, 0);
  const end = zonedWallTimeToUtc(timeZone, addDaysIso(isoDate, 1), 0, 0);
  return { start, end };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function wallTimeInZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '00';

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`;
}
