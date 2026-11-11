import { BadRequestException } from '@nestjs/common';
import { textField } from '../coach-planning/planning.validation';
export const topics = ['mindset', 'nutrition', 'training', 'recovery', 'life'];
export const formats = ['video', 'audio', 'article', 'guide'];
export const assetTypes: Record<string, string[]> = {
  thumbnail: ['image/jpeg', 'image/png', 'image/webp'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav', 'audio/x-wav'],
  guide: ['application/pdf'],
  captions: ['text/vtt'],
};
export function input(body: any) {
  if (!body || !topics.includes(body.topic) || !formats.includes(body.format))
    throw new BadRequestException('Choose a topic and format.');
  const source_url = textField(body.source_url, 'Source URL', 2000, false);
  if (source_url) {
    try {
      const u = new URL(source_url);
      if (u.protocol !== 'https:' || u.username || u.password)
        throw new Error();
    } catch {
      throw new BadRequestException('Use a complete HTTPS source URL.');
    }
  }
  const duration =
    body.duration_minutes === '' || body.duration_minutes == null
      ? null
      : Number(body.duration_minutes);
  if (
    duration !== null &&
    (!Number.isInteger(duration) || duration < 1 || duration > 600)
  )
    throw new BadRequestException(
      'Duration must be between 1 and 600 minutes.',
    );
  return {
    title: textField(body.title, 'Title', 160),
    summary: textField(body.summary, 'Summary', 400, false),
    topic: body.topic,
    format: body.format,
    author: textField(body.author, 'Author or source', 160, false),
    duration_minutes: duration,
    body: textField(body.body, 'Article', 80000, false),
    transcript: textField(body.transcript, 'Transcript', 80000, false),
    source_url,
  };
}
export function uploadInput(body: any, format: string) {
  const purpose = body?.purpose;
  if (!['thumbnail', 'media', 'captions'].includes(purpose))
    throw new BadRequestException('Invalid upload type.');
  const allowed = assetTypes[purpose === 'media' ? format : purpose] || [];
  const max =
    purpose === 'thumbnail'
      ? 5 * 1024 * 1024
      : purpose === 'captions'
        ? 1024 * 1024
        : 50 * 1024 * 1024;
  if (
    !allowed.includes(body.mime) ||
    !Number.isSafeInteger(body.size) ||
    body.size < 1 ||
    body.size > max
  )
    throw new BadRequestException(
      `Choose a supported file up to ${max / 1024 / 1024} MB.`,
    );
  return {
    purpose,
    mime: body.mime,
    size: body.size,
    name: textField(body.name, 'File name', 180).replace(
      /[^a-zA-Z0-9._ ()-]/g,
      '_',
    ),
  };
}
export function ready(row: any, mediaMime?: string) {
  if (!row.title || !row.summary || !row.author)
    throw new BadRequestException(
      'Add a title, summary and author/source before publishing.',
    );
  if (row.format === 'article') {
    if (!row.body.trim())
      throw new BadRequestException('Write the article before publishing.');
  } else if (!row.media_id && !row.source_url)
    throw new BadRequestException(
      'Upload media or add a source link before publishing.',
    );
  if (row.media_id && !assetTypes[row.format]?.includes(mediaMime || ''))
    throw new BadRequestException(
      'The uploaded file does not match this format. Replace or remove it.',
    );
}
