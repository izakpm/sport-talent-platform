import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
export const PERSONAL_EVENT = `id,'personal' AS team_id,'Personal session' AS team_name,'personal' AS source,title,kind,cancelled,to_char(date,'YYYY-MM-DD') AS date,to_char(start_time,'HH24:MI') AS start_time,to_char(end_time,'HH24:MI') AS end_time,venue,notes,'Africa/Johannesburg' AS timezone,(date+start_time) AT TIME ZONE 'Africa/Johannesburg' AS starts_at,(date+end_time) AT TIME ZONE 'Africa/Johannesburg' AS ends_at`;
export function personalInput(body: any, now = Date.now()) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some(
      (k) =>
        ![
          'title',
          'kind',
          'date',
          'start_time',
          'end_time',
          'venue',
          'notes',
        ].includes(k),
    )
  )
    throw new BadRequestException('Enter valid personal session details.');
  const text = (key: string, max: number, required = false) => {
    const v = body[key] ?? '';
    if (
      typeof v !== 'string' ||
      v.trim().length > max ||
      (required && !v.trim())
    )
      throw new BadRequestException(`Check ${key.replace('_', ' ')}.`);
    return v.trim();
  };
  const title = text('title', 120, true),
    kind = text('kind', 20, true),
    date = text('date', 10, true),
    start = text('start_time', 5, true),
    end = text('end_time', 5, true),
    venue = text('venue', 160),
    notes = text('notes', 2000);
  if (
    !['practice', 'gym', 'video', 'match', 'fitness', 'recovery'].includes(kind)
  )
    throw new BadRequestException('Choose a session type.');
  if (
    !/^(19|20)\d{2}-\d{2}-\d{2}$/.test(date) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(end)
  )
    throw new BadRequestException('Enter a valid date and times.');
  const stamp = new Date(date + 'T' + start + ':00+02:00');
  if (
    !Number.isFinite(stamp.getTime()) ||
    new Date(stamp.getTime() + 7200000).toISOString().slice(0, 10) !== date ||
    stamp.getTime() <= now
  )
    throw new BadRequestException('Choose a start time in the future (SAST).');
  if (end <= start)
    throw new BadRequestException(
      'End time must be after start time on the same day.',
    );
  return { title, kind, date, start, end, venue, notes };
}
@Injectable()
export class PersonalCalendarService {
  constructor(private readonly db: DataSource) {}
  async authorize(id: string, tx: any) {
    const [u] = await tx.query('SELECT role,status FROM users WHERE id=$1', [
      id,
    ]);
    if (!u || u.role !== 'ATHLETE' || u.status === 'SUSPENDED')
      throw new ForbiddenException('An active athlete account is required.');
  }
  async save(userId: string, body: any, id?: string) {
    const v = personalInput(body);
    return this.db.transaction(async (tx) => {
      await this.authorize(userId, tx);
      const values = [
        userId,
        v.title,
        v.kind,
        v.date,
        v.start,
        v.end,
        v.venue,
        v.notes,
      ];
      if (id) {
        const [existing] = await tx.query(
          'SELECT cancelled FROM athlete_calendar_events WHERE user_id=$1 AND id=$2 FOR UPDATE',
          [userId, id],
        );
        if (!existing)
          throw new NotFoundException('Personal session not found.');
        if (existing.cancelled)
          throw new ConflictException(
            'Cancelled sessions cannot be edited. Create a new session instead.',
          );
        const [row] = await tx.query(
          `UPDATE athlete_calendar_events SET title=$2,kind=$3,date=$4,start_time=$5,end_time=$6,venue=$7,notes=$8 WHERE user_id=$1 AND id=$9 RETURNING ${PERSONAL_EVENT}`,
          [...values, id],
        );
        return row;
      }
      const [row] = await tx.query(
        `INSERT INTO athlete_calendar_events(user_id,title,kind,date,start_time,end_time,venue,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${PERSONAL_EVENT}`,
        values,
      );
      return row;
    });
  }
  async cancel(userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      await this.authorize(userId, tx);
      const [row] = await tx.query(
        `UPDATE athlete_calendar_events SET cancelled=true WHERE user_id=$1 AND id=$2 RETURNING ${PERSONAL_EVENT}`,
        [userId, id],
      );
      if (!row) throw new NotFoundException('Personal session not found.');
      return row;
    });
  }
}
