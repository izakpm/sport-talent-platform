import { BadRequestException } from '@nestjs/common';
export function profileInput(
  body: any,
): Record<string, string | number | null> {
  const limits: Record<string, number> = {
    first_name: 80,
    last_name: 80,
    phone: 40,
    headline: 120,
    primary_sport: 80,
    location: 160,
    specialisms: 240,
    bio: 2000,
  };
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    !Object.keys(body).length
  )
    throw new BadRequestException('Enter the details you want to update.');
  const result: Record<string, string | number | null> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === 'years_experience') {
      if (
        value !== null &&
        (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 80)
      )
        throw new BadRequestException(
          'Years of experience must be between 0 and 80.',
        );
      result[key] = value as number | null;
      continue;
    }
    if (key === 'profile_image') {
      if (value === null) {
        result[key] = null;
        continue;
      }
      if (typeof value !== 'string' || value.length > 2800000)
        throw new BadRequestException(
          'Choose a JPG, PNG or WebP photo up to 2 MB.',
        );
      const match = value.match(
        /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/,
      );
      if (!match)
        throw new BadRequestException('Choose a JPG, PNG or WebP photo.');
      const bytes = Buffer.from(match[2], 'base64');
      const valid =
        match[1] === 'png'
          ? bytes
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : match[1] === 'jpeg'
            ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
            : bytes.subarray(0, 4).toString() === 'RIFF' &&
              bytes.subarray(8, 12).toString() === 'WEBP';
      if (!valid || bytes.length > 2097152)
        throw new BadRequestException('Choose a valid photo up to 2 MB.');
      result[key] = value;
      continue;
    }
    if (!Object.hasOwn(limits, key))
      throw new BadRequestException(
        'Only personal and coaching details can be changed here.',
      );
    if (typeof value !== 'string' || value.trim().length > limits[key])
      throw new BadRequestException(
        `${key.replace(/_/g, ' ')} must be at most ${limits[key]} characters.`,
      );
    const text = value.trim();
    if ((key === 'first_name' || key === 'last_name') && !text)
      throw new BadRequestException('Enter your first and last name.');
    if (
      key === 'phone' &&
      text &&
      (!/^[+0-9 ()-]+$/.test(text) ||
        text.replace(/\D/g, '').length < 6 ||
        text.replace(/\D/g, '').length > 20)
    )
      throw new BadRequestException(
        'Enter a valid phone number, including the country code for international numbers.',
      );
    result[key] = text;
  }
  return result;
}
