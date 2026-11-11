import { PERSONAL_EVENT } from './personal-calendar.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import * as QRCode from 'qrcode';
import { textField } from '../coach-planning/planning.validation';
const hash = (code: string) => createHash('sha256').update(code).digest('hex');
const EVENT = `e.id,e.team_id,e.title,e.cancelled,to_char(e.date,'YYYY-MM-DD') AS date,to_char(e.start_time,'HH24:MI') AS start_time,to_char(e.end_time,'HH24:MI') AS end_time,e.venue,t.name AS team_name,(e.date+e.start_time) AT TIME ZONE t.timezone AS starts_at,(e.date+e.end_time) AT TIME ZONE t.timezone AS ends_at`;
export function checkWindow(event: any, now = Date.now()) {
  if (event.cancelled)
    throw new ConflictException('This session has been cancelled.');
  if (
    now < new Date(event.starts_at).getTime() - 30 * 60000 ||
    now > new Date(event.ends_at).getTime() + 60 * 60000
  )
    throw new ConflictException(
      'QR check-in opens 30 minutes before the session and closes one hour after it ends.',
    );
}
@Injectable()
export class HubService {
  constructor(private readonly db: DataSource) {}
  async authorize(
    userId: string,
    role?: string,
    db: DataSource | EntityManager = this.db,
  ) {
    const [u] = await db.query('SELECT role,status FROM users WHERE id=$1', [
      userId,
    ]);
    if (
      !u ||
      u.status === 'SUSPENDED' ||
      !['COACH', 'ATHLETE'].includes(u.role) ||
      (role && u.role !== role)
    )
      throw new ForbiddenException('This account cannot access this feature.');
    return u.role;
  }
  async ownedTeam(
    userId: string,
    teamId: string,
    db: DataSource | EntityManager = this.db,
  ) {
    const [t] = await db.query(
      'SELECT * FROM coach_teams WHERE id=$1 AND coach_id=$2',
      [teamId, userId],
    );
    if (!t) throw new NotFoundException('Team not found.');
    return t;
  }
  async ownedEvent(
    userId: string,
    id: string,
    db: DataSource | EntityManager = this.db,
    lock = false,
  ) {
    const [e] = await db.query(
      `SELECT ${EVENT} FROM coach_schedule_events e JOIN coach_teams t ON t.id=e.team_id WHERE e.id=$1 AND t.coach_id=$2 ${lock ? 'FOR UPDATE OF e' : ''}`,
      [id, userId],
    );
    if (!e) throw new NotFoundException('Session not found.');
    return e;
  }
  async member(
    userId: string,
    teamId: string,
    db: DataSource | EntityManager = this.db,
  ) {
    const [p] = await db.query(
      `SELECT p.id FROM coach_player_accounts a JOIN coach_team_players p ON p.id=a.player_id WHERE a.user_id=$1 AND a.team_id=$2 AND p.status='active'`,
      [userId, teamId],
    );
    if (!p)
      throw new ForbiddenException(
        'Ask your coach to link your athlete account to an active player in this team.',
      );
    return p;
  }
  async teams(userId: string) {
    const role = await this.authorize(userId);
    return role === 'COACH'
      ? this.db.query(
          'SELECT id,name,age_group FROM coach_teams WHERE coach_id=$1 ORDER BY name',
          [userId],
        )
      : this.db.query(
          `SELECT t.id,t.name,t.age_group FROM coach_teams t JOIN coach_player_accounts a ON a.team_id=t.id JOIN coach_team_players p ON p.id=a.player_id WHERE a.user_id=$1 AND p.status='active' ORDER BY t.name`,
          [userId],
        );
  }
  async link(userId: string, teamId: string, playerId: string, body: any) {
    await this.authorize(userId, 'COACH');
    await this.ownedTeam(userId, teamId);
    return this.db.transaction(async (tx) => {
      const [p] = await tx.query(
        'SELECT id FROM coach_team_players WHERE id=$1 AND team_id=$2 FOR UPDATE',
        [playerId, teamId],
      );
      if (!p) throw new NotFoundException('Player not found.');
      if (body?.email === null) {
        await tx.query('DELETE FROM coach_player_accounts WHERE player_id=$1', [
          playerId,
        ]);
        return { linked: false };
      }
      const email = textField(body?.email, 'Athlete email', 254).toLowerCase();
      const [athlete] = await tx.query(
        "SELECT id FROM users WHERE lower(email)=$1 AND role='ATHLETE' AND status IS DISTINCT FROM 'SUSPENDED'",
        [email],
      );
      if (!athlete)
        throw new BadRequestException(
          'No active athlete account matches that email. Ask the player to register first.',
        );
      const [current] = await tx.query(
        'SELECT user_id FROM coach_player_accounts WHERE player_id=$1',
        [playerId],
      );
      if (current && current.user_id !== athlete.id)
        throw new ConflictException(
          'Unlink the current account before linking another athlete.',
        );
      const [historical] = await tx.query(
        'SELECT 1 FROM coach_session_attendance WHERE player_id=$1 AND user_id IS NOT NULL AND user_id<>$2 LIMIT 1',
        [playerId, athlete.id],
      );
      if (historical)
        throw new ConflictException(
          'This roster entry has another athlete’s attendance history. Create a separate roster entry for this athlete.',
        );
      try {
        await tx.query(
          'INSERT INTO coach_player_accounts(player_id,team_id,user_id) VALUES($1,$2,$3) ON CONFLICT(player_id) DO UPDATE SET user_id=EXCLUDED.user_id',
          [playerId, teamId, athlete.id],
        );
      } catch (err) {
        if ((err as any).code === '23505')
          throw new ConflictException(
            'That athlete is already linked to a player in this team.',
          );
        throw err;
      }
      await tx.query(
        'UPDATE coach_session_attendance SET user_id=$1 WHERE player_id=$2 AND user_id IS NULL',
        [athlete.id, playerId],
      );
      return { linked: true };
    });
  }
  async links(userId: string, teamId: string) {
    await this.authorize(userId, 'COACH');
    await this.ownedTeam(userId, teamId);
    return this.db.query(
      'SELECT a.player_id,u.email,u.first_name,u.last_name FROM coach_player_accounts a JOIN users u ON u.id=a.user_id WHERE a.team_id=$1',
      [teamId],
    );
  }
  async feed(userId: string, teamId?: string) {
    const teams = await this.teams(userId);
    const ids = teams.map((t: any) => t.id);
    if (teamId && !ids.includes(teamId))
      throw new ForbiddenException('Team not available.');
    return this.db.query(
      `SELECT p.*,t.name AS team_name,u.first_name AS coach_first_name,u.last_name AS coach_last_name FROM coach_team_posts p JOIN coach_teams t ON t.id=p.team_id JOIN users u ON u.id=p.coach_id WHERE p.team_id=ANY($1::uuid[]) ORDER BY p.created_at DESC,p.id DESC LIMIT 100`,
      [teamId ? [teamId] : ids],
    );
  }
  async post(userId: string, body: any) {
    await this.authorize(userId, 'COACH');
    if (
      typeof body?.team_id !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(body.team_id)
    )
      throw new BadRequestException('Choose a team.');
    await this.ownedTeam(userId, body.team_id);
    const title = textField(body?.title, 'Subject', 120);
    const message = textField(body?.body, 'Message', 3000);
    if (!['announcement', 'reminder'].includes(body?.category))
      throw new BadRequestException('Choose an announcement or reminder.');
    const [row] = await this.db.query(
      'INSERT INTO coach_team_posts(team_id,coach_id,title,body,category) VALUES($1,$2,$3,$4,$5) RETURNING *',
      [body.team_id, userId, title, message, body.category],
    );
    return row;
  }
  async removePost(userId: string, id: string) {
    await this.authorize(userId, 'COACH');
    const rows = await this.db.query(
      `WITH removed AS (DELETE FROM coach_team_posts p USING coach_teams t WHERE p.id=$1 AND p.team_id=t.id AND t.coach_id=$2 AND p.category<>'cancellation' RETURNING p.id) SELECT * FROM removed`,
      [id, userId],
    );
    if (!rows.length)
      throw new NotFoundException(
        'Announcement not found or is a session cancellation.',
      );
    return { deleted: true };
  }
  async sessions(userId: string) {
    const role = await this.authorize(userId);
    const teams = await this.teams(userId);
    return this.db.query(
      `SELECT ${EVENT}${role === 'ATHLETE' ? ',a.status AS attendance_status,a.method AS attendance_method,a.note AS attendance_note' : ''} FROM coach_schedule_events e JOIN coach_teams t ON t.id=e.team_id ${role === 'ATHLETE' ? 'LEFT JOIN coach_session_attendance a ON a.event_id=e.id AND a.user_id=$2' : ''} WHERE e.team_id=ANY($1::uuid[]) AND e.date BETWEEN CURRENT_DATE-90 AND CURRENT_DATE+31 ORDER BY e.date DESC,e.start_time DESC LIMIT 500`,
      role === 'ATHLETE'
        ? [teams.map((t: any) => t.id), userId]
        : [teams.map((t: any) => t.id)],
    );
  }
  async calendar(userId: string, month: string) {
    await this.authorize(userId, 'ATHLETE');
    if (
      typeof month !== 'string' ||
      !/^(19|20)\d{2}-(0[1-9]|1[0-2])$/.test(month)
    )
      throw new BadRequestException('Choose a month between 1900 and 2099.');
    const teamEvents = await this.db.query(
      `SELECT ${EVENT},e.kind,e.notes,t.timezone,'team' AS source FROM coach_schedule_events e JOIN coach_teams t ON t.id=e.team_id WHERE e.date >= $2::date AND e.date < $2::date + interval '1 month' AND EXISTS(SELECT 1 FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id WHERE m.user_id=$1 AND m.team_id=e.team_id AND p.status='active') ORDER BY e.date,e.start_time,t.name,e.id`,
      [userId, month + '-01'],
    );
    const personalEvents = await this.db.query(
      `SELECT ${PERSONAL_EVENT} FROM athlete_calendar_events WHERE user_id=$1 AND date >= $2::date AND date < $2::date + interval '1 month'`,
      [userId, month + '-01'],
    );
    return [...teamEvents, ...personalEvents].sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime() ||
        a.id.localeCompare(b.id),
    );
  }
  async register(userId: string, id: string) {
    await this.authorize(userId, 'COACH');
    const event = await this.ownedEvent(userId, id);
    const players = await this.db.query(
      `SELECT p.id,p.first_name,p.last_name,p.status AS player_status,a.status,a.method,a.note,a.created_at,a.reviewed_at,(m.user_id IS NOT NULL) AS linked FROM coach_team_players p LEFT JOIN coach_session_attendance a ON a.player_id=p.id AND a.event_id=$2 LEFT JOIN coach_player_accounts m ON m.player_id=p.id WHERE p.team_id=$1 AND (p.status='active' OR a.event_id IS NOT NULL) ORDER BY p.last_name,p.first_name`,
      [event.team_id, id],
    );
    return { event, players };
  }
  async pending(userId: string) {
    await this.authorize(userId, 'COACH');
    return this.db.query(
      `SELECT a.*,e.title,to_char(e.date,'YYYY-MM-DD') AS date,t.name AS team_name,p.first_name,p.last_name FROM coach_session_attendance a JOIN coach_schedule_events e ON e.id=a.event_id JOIN coach_teams t ON t.id=e.team_id JOIN coach_team_players p ON p.id=a.player_id WHERE t.coach_id=$1 AND a.status='pending' AND NOT e.cancelled ORDER BY a.created_at`,
      [userId],
    );
  }
  async summary(userId: string) {
    await this.authorize(userId, 'COACH');
    const [row] = await this.db.query(
      `SELECT ((SELECT count(*) FROM coach_session_attendance a JOIN coach_schedule_events e ON e.id=a.event_id JOIN coach_teams t ON t.id=e.team_id WHERE t.coach_id=$1 AND a.status='pending' AND NOT e.cancelled) + (SELECT count(*) FROM activity_coach_requests r JOIN activities a ON a.id=r.activity_id JOIN athlete_profiles ap ON ap.id=a.athlete_id JOIN users u ON u.id=ap.user_id WHERE r.coach_id=$1 AND r.status='pending' AND u.status IS DISTINCT FROM 'SUSPENDED' AND EXISTS(SELECT 1 FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id JOIN coach_teams t ON t.id=m.team_id WHERE m.user_id=ap.user_id AND t.coach_id=r.coach_id AND p.status='active')))::int AS pending`,
      [userId],
    );
    return row;
  }
  async decide(userId: string, eventId: string, playerId: string, body: any) {
    await this.authorize(userId, 'COACH');
    if (!['verified', 'declined', 'absent'].includes(body?.status))
      throw new BadRequestException('Choose attended, absent or declined.');
    return this.db.transaction(async (tx) => {
      const event = await this.ownedEvent(userId, eventId, tx, true);
      if (event.cancelled || Date.now() < new Date(event.starts_at).getTime())
        throw new ConflictException(
          'Attendance can only be recorded after a session starts and cannot be recorded for cancelled sessions.',
        );
      const [p] = await tx.query(
        'SELECT p.id,m.user_id FROM coach_team_players p LEFT JOIN coach_player_accounts m ON m.player_id=p.id WHERE p.id=$1 AND p.team_id=$2',
        [playerId, event.team_id],
      );
      if (!p) throw new NotFoundException('Player not found.');
      const [row] = await tx.query(
        `INSERT INTO coach_session_attendance(event_id,player_id,user_id,status,method,reviewed_by,reviewed_at) VALUES($1,$2,$3,$4,'coach',$5,now()) ON CONFLICT(event_id,player_id) DO UPDATE SET status=$4,method='coach',reviewed_by=$5,reviewed_at=now() RETURNING *`,
        [eventId, playerId, p.user_id || null, body.status, userId],
      );
      return row;
    });
  }
  async request(userId: string, id: string, body: any) {
    await this.authorize(userId, 'ATHLETE');
    return this.db.transaction(async (tx) => {
      const [event] = await tx.query(
        `SELECT ${EVENT} FROM coach_schedule_events e JOIN coach_teams t ON t.id=e.team_id WHERE e.id=$1 FOR UPDATE OF e`,
        [id],
      );
      if (!event) throw new NotFoundException('Session not found.');
      const player = await this.member(userId, event.team_id, tx);
      if (event.cancelled || Date.now() < new Date(event.starts_at).getTime())
        throw new ConflictException(
          'You can request verification after the session starts. Cancelled sessions cannot be verified.',
        );
      const note = textField(body?.note, 'Note', 500, false);
      await tx.query(
        `INSERT INTO coach_session_attendance(event_id,player_id,user_id,status,method,note) VALUES($1,$2,$3,'pending','request',$4) ON CONFLICT(event_id,player_id) DO NOTHING`,
        [id, player.id, userId, note],
      );
      const [row] = await tx.query(
        'SELECT status,method FROM coach_session_attendance WHERE event_id=$1 AND player_id=$2',
        [id, player.id],
      );
      return row;
    });
  }
  async issue(userId: string, id: string) {
    await this.authorize(userId, 'COACH');
    return this.db.transaction(async (tx) => {
      const event = await this.ownedEvent(userId, id, tx, true);
      checkWindow(event);
      const code = randomBytes(32).toString('base64url');
      const expires = new Date(
        Math.min(
          Date.now() + 15 * 60000,
          new Date(event.ends_at).getTime() + 60 * 60000,
        ),
      );
      await tx.query(
        'INSERT INTO coach_session_codes(event_id,token_hash,expires_at) VALUES($1,$2,$3) ON CONFLICT(event_id) DO UPDATE SET token_hash=$2,expires_at=$3',
        [id, hash(code), expires],
      );
      const origin = process.env.FRONTEND_URL || 'http://localhost:3000';
      const url = `${origin.replace(/\/$/, '')}/check-in#code=${code}`;
      return {
        qr: await QRCode.toDataURL(url, {
          width: 360,
          margin: 4,
          errorCorrectionLevel: 'M',
        }),
        url,
        expires_at: expires,
      };
    });
  }
  async closeCode(userId: string, id: string) {
    await this.authorize(userId, 'COACH');
    return this.db.transaction(async (tx) => {
      await this.ownedEvent(userId, id, tx, true);
      await tx.query('DELETE FROM coach_session_codes WHERE event_id=$1', [id]);
      return { closed: true };
    });
  }
  async scan(userId: string, body: any, confirm: boolean) {
    await this.authorize(userId, 'ATHLETE');
    if (
      typeof body?.code !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(body.code)
    )
      throw new BadRequestException(
        'This check-in link is invalid. Scan the coach’s current QR code.',
      );
    return this.db.transaction(async (tx) => {
      const [event] = await tx.query(
        `SELECT ${EVENT},c.expires_at FROM coach_session_codes c JOIN coach_schedule_events e ON e.id=c.event_id JOIN coach_teams t ON t.id=e.team_id WHERE c.token_hash=$1 AND c.expires_at>now() FOR UPDATE OF e,c`,
        [hash(body.code)],
      );
      if (!event)
        throw new BadRequestException(
          'This QR code has expired or was closed. Ask your coach for a new code.',
        );
      checkWindow(event);
      const player = await this.member(userId, event.team_id, tx);
      if (!confirm) return { event };
      await tx.query(
        `INSERT INTO coach_session_attendance(event_id,player_id,user_id,status,method) VALUES($1,$2,$3,'verified','qr') ON CONFLICT(event_id,player_id) DO UPDATE SET status='verified',method='qr' WHERE coach_session_attendance.status='pending'`,
        [event.id, player.id, userId],
      );
      const [row] = await tx.query(
        'SELECT status,method FROM coach_session_attendance WHERE event_id=$1 AND player_id=$2',
        [event.id, player.id],
      );
      return { ...row, event };
    });
  }
  async cancel(userId: string, id: string, body: any) {
    await this.authorize(userId, 'COACH');
    const reason = textField(body?.reason, 'Cancellation message', 1000);
    return this.db.transaction(async (tx) => {
      const event = await this.ownedEvent(userId, id, tx, true);
      const [result] = await tx.query(
        'SELECT 1 FROM match_results WHERE event_id=$1',
        [id],
      );
      if (result)
        throw new ConflictException(
          'A match with a recorded result cannot be cancelled. Edit the result from Matches.',
        );
      if (event.cancelled) return { cancelled: true };
      await tx.query(
        'UPDATE coach_schedule_events SET cancelled=true WHERE id=$1',
        [id],
      );
      await tx.query('DELETE FROM coach_session_codes WHERE event_id=$1', [id]);
      await tx.query(
        `INSERT INTO coach_team_posts(team_id,coach_id,title,body,category,event_id) VALUES($1,$2,$3,$4,'cancellation',$5)`,
        [
          event.team_id,
          userId,
          `Cancelled: ${event.title}`.slice(0, 120),
          `${event.date} · ${event.start_time} — ${reason}`,
          id,
        ],
      );
      return { cancelled: true };
    });
  }
}
