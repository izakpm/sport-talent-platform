import { BadRequestException } from '@nestjs/common';
import { profileInput } from '../coach-profile/profile.validation';
export const METRICS: Record<string, string> = {
  'Bench press': 'kg',
  Squat: 'kg',
  Deadlift: 'kg',
  '40 m sprint': 's',
  '100 m sprint': 's',
  'Vertical jump': 'cm',
  'Bronco test': 's',
  'Body weight': 'kg',
};
export function detailsInput(body: any) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !Object.keys(body).length
  )
    throw new BadRequestException('Enter details to save.');
  const result: Record<string, string | null> = {};
  for (const [key, value] of Object.entries(body)) {
    if (['first_name', 'last_name', 'phone', 'profile_image'].includes(key)) {
      Object.assign(result, profileInput({ [key]: value }));
      continue;
    }
    const limits: Record<string, number> = {
      nationality: 80,
      province: 100,
      bio: 2000,
    };
    if (
      !Object.hasOwn(limits, key) ||
      typeof value !== 'string' ||
      value.trim().length > limits[key]
    )
      throw new BadRequestException('Enter valid personal details.');
    result[key] = value.trim();
  }
  return result;
}
export function entryInput(body: any) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some(
      (k) =>
        !['kind', 'title', 'date', 'organization', 'notes', 'value'].includes(
          k,
        ),
    )
  )
    throw new BadRequestException(
      'Enter a valid achievement or performance result.',
    );
  const text = (key: string, max: number, required = false) => {
    const v = body[key] ?? '';
    if (
      typeof v !== 'string' ||
      v.trim().length > max ||
      (required && !v.trim())
    )
      throw new BadRequestException(`Check ${key}.`);
    return v.trim();
  };
  const kind = body.kind;
  if (!['achievement', 'metric'].includes(kind))
    throw new BadRequestException('Choose an achievement or metric.');
  const title = text('title', 160, true),
    date = text('date', 10, true),
    organization = text('organization', 160),
    notes = text('notes', 1500);
  const parsed = new Date(date + 'T00:00:00Z');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date ||
    date < '1900-01-01' ||
    date >
      new Date().toLocaleDateString('en-CA', {
        timeZone: 'Africa/Johannesburg',
      })
  )
    throw new BadRequestException('Choose a valid date, no later than today.');
  let value: number | null = null,
    unit: string | null = null;
  if (kind === 'metric') {
    if (
      !Object.hasOwn(METRICS, title) ||
      typeof body.value !== 'number' ||
      !Number.isFinite(body.value) ||
      body.value <= 0 ||
      body.value > 10000
    )
      throw new BadRequestException(
        'Select a metric and enter a result greater than zero, up to 10,000.',
      );
    value = body.value;
    unit = METRICS[title];
  } else if (body.value != null)
    throw new BadRequestException('Achievements do not have a measured value.');
  return { kind, title, date, organization, notes, value, unit };
}
