import { BadRequestException } from '@nestjs/common';
import { textField } from './planning.validation';

export const RUGBY_POSITIONS = [
  'Prop',
  'Hooker',
  'Lock',
  'Flanker',
  'Number 8',
  'Scrum-half',
  'Fly-half',
  'Centre',
  'Wing',
  'Full-back',
];
export function playerInput(body: any) {
  const first = textField(body?.first_name, 'First name', 80);
  const last = textField(body?.last_name, 'Last name', 80);
  const position = textField(body?.position, 'Position', 30, false);
  if (position && !RUGBY_POSITIONS.includes(position))
    throw new BadRequestException('Choose a rugby position.');
  const number = body?.shirt_number ?? null;
  if (
    number !== null &&
    (!Number.isInteger(number) || number < 1 || number > 99)
  )
    throw new BadRequestException(
      'Shirt number must be from 1 to 99, or left blank.',
    );
  const status = body?.status ?? 'active';
  if (!['active', 'inactive'].includes(status))
    throw new BadRequestException('Choose active or inactive.');
  const captain = body?.is_captain ?? false;
  if (typeof captain !== 'boolean')
    throw new BadRequestException('Captain must be true or false.');
  return [first, last, position, number, captain, status];
}
