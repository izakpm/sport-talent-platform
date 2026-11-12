import { BadRequestException } from '@nestjs/common';
export function birthDate(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value ||
    value < '1900-01-01' ||
    value >
      new Date().toLocaleDateString('en-CA', {
        timeZone: 'Africa/Johannesburg',
      })
  )
    throw new BadRequestException(
      'Enter your valid date of birth before accepting.',
    );
  return value;
}
export function requiresParent(
  dob: string | null | undefined,
  today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Africa/Johannesburg',
  }),
) {
  if (!dob) return true;
  const date = birthDate(dob);
  if (date > today || date < '1900-01-01')
    throw new BadRequestException('Enter a valid date of birth.');
  const [year, month, day] = date.split('-').map(Number);
  const [nowYear, nowMonth, nowDay] = today.split('-').map(Number);
  return (
    nowYear -
      year -
      (nowMonth < month || (nowMonth === month && nowDay < day) ? 1 : 0) <
    18
  );
}
