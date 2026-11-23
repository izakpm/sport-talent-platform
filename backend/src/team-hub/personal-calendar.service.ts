import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  connectedSql,
  INVITATION_EVENT,
  INVITATION_FROM,
} from './session-invitation.sql';
export const PERSONAL_INVITEE = `(SELECT invitee_id FROM personal_session_invitations WHERE event_id=athlete_calendar_events.id) AS invitee_id,(SELECT status FROM personal_session_invitations WHERE event_id=athlete_calendar_events.id) AS invitation_status,(SELECT concat_ws(' ',u.first_name,u.last_name) FROM personal_session_invitations i JOIN users u ON u.id=i.invitee_id WHERE i.event_id=athlete_calendar_events.id) AS invitee_name`;
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
          'invitee_id',
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
  const invitee = body.invitee_id;
  if (
    invitee !== undefined &&
    invitee !== null &&
    (typeof invitee !== 'string' ||
      !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(invitee))
  )
    throw new BadRequestException(
      'Choose a connected person or keep this session private.',
    );
  return { title, kind, date, start, end, venue, notes, invitee };
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
      if (v.invitee) await this.checkConnection(tx, userId, v.invitee);
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
          `WITH updated AS (UPDATE athlete_calendar_events SET title=$2,kind=$3,date=$4,start_time=$5,end_time=$6,venue=$7,notes=$8 WHERE user_id=$1 AND id=$9 RETURNING ${PERSONAL_EVENT}) SELECT * FROM updated`,
          [...values, id],
        );
        await this.syncInvitation(tx, userId, id, v.invitee);
        const [invitation] = await tx.query(
          `SELECT ${PERSONAL_INVITEE} FROM athlete_calendar_events WHERE id=$1`,
          [id],
        );
        return { ...row, ...invitation };
      }
      const [row] = await tx.query(
        `INSERT INTO athlete_calendar_events(user_id,title,kind,date,start_time,end_time,venue,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${PERSONAL_EVENT}`,
        values,
      );
      if (v.invitee) await this.syncInvitation(tx, userId, row.id, v.invitee);
      return {
        ...row,
        invitee_id: v.invitee || null,
        invitation_status: v.invitee ? 'pending' : null,
      };
    });
  }
  async checkConnection(tx: any, owner: string, invitee: string) {
    const [person] = await tx.query(
      `SELECT id FROM users WHERE id=$2 AND id<>$1 AND role IN ('ATHLETE','COACH') AND status IS DISTINCT FROM 'SUSPENDED' AND ${connectedSql('$1', '$2')}`,
      [owner, invitee],
    );
    if (!person)
      throw new ForbiddenException(
        'Choose a coach or teammate from your active connections.',
      );
  }
  async syncInvitation(
    tx: any,
    owner: string,
    eventId: string,
    invitee: string | null | undefined,
  ) {
    if (invitee === null) {
      await tx.query(
        'DELETE FROM personal_session_invitations WHERE event_id=$1',
        [eventId],
      );
      return;
    }
    if (invitee === undefined) {
      const [existing] = await tx.query(
        'SELECT invitee_id FROM personal_session_invitations WHERE event_id=$1',
        [eventId],
      );
      if (!existing) return;
      invitee = existing.invitee_id;
    }
    await this.checkConnection(tx, owner, invitee!);
    await tx.query(
      `INSERT INTO personal_session_invitations(event_id,invitee_id) VALUES($1,$2) ON CONFLICT(event_id) DO UPDATE SET invitee_id=$2,status='pending',responded_at=null,invited_at=now()`,
      [eventId, invitee],
    );
  }
  async invitations(userId: string) {
    const [user] = await this.db.query(
      "SELECT id FROM users WHERE id=$1 AND role IN ('ATHLETE','COACH') AND status IS DISTINCT FROM 'SUSPENDED'",
      [userId],
    );
    if (!user)
      throw new ForbiddenException(
        'An active athlete or coach account is required.',
      );
    return this.db.query(
      `SELECT ${INVITATION_EVENT} ${INVITATION_FROM} AND e.date >= (now() AT TIME ZONE 'Africa/Johannesburg')::date ORDER BY e.date,e.start_time`,
      [userId],
    );
  }
  async respond(userId: string, eventId: string, body: any) {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).some((k) => !['status', 'invited_at'].includes(k)) ||
      !['accepted', 'declined'].includes(body.status) ||
      typeof body.invited_at !== 'string' ||
      !Number.isFinite(Date.parse(body.invited_at))
    )
      throw new BadRequestException(
        'Accept or decline the current invitation.',
      );
    await this.db.transaction(async (tx) => {
      const [user] = await tx.query(
        "SELECT id FROM users WHERE id=$1 AND role IN ('ATHLETE','COACH') AND status IS DISTINCT FROM 'SUSPENDED'",
        [userId],
      );
      if (!user)
        throw new ForbiddenException(
          'An active athlete or coach account is required.',
        );
      // Same event lock as edit/cancel: an old approval cannot race an updated plan.
      await tx.query(
        'SELECT id FROM athlete_calendar_events WHERE id=$1 FOR UPDATE',
        [eventId],
      );
      const [event] = await tx.query(
        `SELECT e.id,e.cancelled,i.invited_at,(e.date+e.start_time) AT TIME ZONE 'Africa/Johannesburg' AS starts_at ${INVITATION_FROM} AND e.id=$2`,
        [userId, eventId],
      );
      if (!event)
        throw new NotFoundException(
          'Invitation not found in your active connections.',
        );
      if (new Date(event.invited_at).getTime() !== Date.parse(body.invited_at))
        throw new ConflictException(
          'The plan has changed. Refresh invitations and review the new details.',
        );
      if (event.cancelled || new Date(event.starts_at).getTime() <= Date.now())
        throw new ConflictException(
          'This session has started or been cancelled.',
        );
      await tx.query(
        'UPDATE personal_session_invitations SET status=$2,responded_at=now() WHERE event_id=$1',
        [eventId, body.status],
      );
    });
    return { status: body.status };
  }
  async cancel(userId: string, id: string) {
    return this.db.transaction(async (tx) => {
      await this.authorize(userId, tx);
      const [row] = await tx.query(
        `WITH updated AS (UPDATE athlete_calendar_events SET cancelled=true WHERE user_id=$1 AND id=$2 RETURNING ${PERSONAL_EVENT}) SELECT * FROM updated`,
        [userId, id],
      );
      if (!row) throw new NotFoundException('Personal session not found.');
      return row;
    });
  }
}
