import { BadRequestException } from '@nestjs/common';

export const EVENT_KINDS = [
  'practice',
  'gym',
  'video',
  'match',
  'fitness',
  'recovery',
];
export function textField(
  value: unknown,
  label: string,
  max: number,
  required = true,
): string {
  if (value === undefined && !required) return '';
  if (
    typeof value !== 'string' ||
    value.trim().length > max ||
    (required && !value.trim())
  ) {
    throw new BadRequestException(
      `${label} must be ${required ? '1' : '0'}–${max} characters.`,
    );
  }
  return value.trim();
}
export function validDate(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value ||
    value < '2000-01-01' ||
    value > '2100-12-31'
  ) {
    throw new BadRequestException('Choose a valid date between 2000 and 2100.');
  }
  return value;
}
export function eventInput(body: any) {
  if (!body || !EVENT_KINDS.includes(body.kind))
    throw new BadRequestException('Choose a session type.');
  const date = validDate(body.date);
  const time = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (
    !time.test(body.start_time) ||
    !time.test(body.end_time) ||
    body.end_time <= body.start_time
  ) {
    throw new BadRequestException(
      'End time must be after start time on the same day.',
    );
  }
  return {
    title: textField(body.title, 'Title', 120),
    kind: body.kind as string,
    date,
    start_time: body.start_time as string,
    end_time: body.end_time as string,
    venue: textField(body.venue, 'Venue', 160, false),
    notes: textField(body.notes, 'Notes', 2000, false),
  };
}
export function occurrenceDates(
  start: string,
  repeat?: { until?: unknown; weekdays?: unknown },
): string[] {
  if (!repeat) return [start];
  const until = validDate(repeat.until);
  const span = (Date.parse(until) - Date.parse(start)) / 86400000;
  if (span < 0 || span > 92)
    throw new BadRequestException(
      'Repeat end must be within 92 days of the start.',
    );
  if (
    !Array.isArray(repeat.weekdays) ||
    !repeat.weekdays.length ||
    repeat.weekdays.some((d) => !Number.isInteger(d) || d < 0 || d > 6)
  ) {
    throw new BadRequestException('Choose at least one weekday.');
  }
  const weekdays = new Set(repeat.weekdays);
  const dates: string[] = [];
  for (let day = Date.parse(start); day <= Date.parse(until); day += 86400000) {
    const date = new Date(day);
    if (weekdays.has(date.getUTCDay()))
      dates.push(date.toISOString().slice(0, 10));
  }
  if (!dates.length)
    throw new BadRequestException('No sessions fall within those dates.');
  return dates;
}
