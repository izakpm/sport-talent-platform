import { BadRequestException } from '@nestjs/common';
export const TRAINING_KINDS = [
  'Gym / strength',
  'Practice',
  'Fitness / conditioning',
  'Match',
  'Video session',
  'Recovery',
  'Other',
];
export function note(value: any, max = 1000) {
  if (value == null) return '';
  if (typeof value !== 'string' || value.trim().length > max)
    throw new BadRequestException(`Keep notes to ${max} characters.`);
  return value.trim();
}
export function activityInput(body: any) {
  const allowed = [
    'title',
    'sport_id',
    'training_kind',
    'date',
    'time',
    'duration_minutes',
    'location',
    'description',
    'effort',
  ];
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((k) => !allowed.includes(k))
  )
    throw new BadRequestException('Enter valid training details.');
  const title = note(body.title, 120),
    location = note(body.location, 160),
    description = note(body.description, 2000);
  if (!title || !TRAINING_KINDS.includes(body.training_kind))
    throw new BadRequestException('Enter a title and select a session type.');
  if (typeof body.sport_id !== 'string' || !body.sport_id)
    throw new BadRequestException('Select a sport.');
  if (
    typeof body.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
    typeof body.time !== 'string' ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.time)
  )
    throw new BadRequestException('Enter a valid date and start time.');
  const stamp = new Date(body.date + 'T' + body.time + ':00+02:00');
  const localDate = new Date(stamp.getTime() + 7200000);
  if (
    !Number.isFinite(stamp.getTime()) ||
    localDate.toISOString().slice(0, 10) !== body.date ||
    body.date < '1900-01-01'
  )
    throw new BadRequestException('Enter a valid training date.');
  if (
    !Number.isInteger(body.duration_minutes) ||
    body.duration_minutes < 1 ||
    body.duration_minutes > 1440
  )
    throw new BadRequestException(
      'Duration must be between 1 and 1,440 minutes.',
    );
  if (stamp.getTime() + body.duration_minutes * 60000 > Date.now())
    throw new BadRequestException(
      'Log a completed session after it has finished.',
    );
  const effort = body.effort ?? null;
  if (
    effort !== null &&
    (!Number.isInteger(effort) || effort < 1 || effort > 10)
  )
    throw new BadRequestException(
      'Effort must be a whole number from 1 to 10.',
    );
  return {
    title,
    sport_id: body.sport_id,
    training_kind: body.training_kind,
    start: body.date + ' ' + body.time,
    duration: body.duration_minutes,
    location,
    description,
    effort,
  };
}
