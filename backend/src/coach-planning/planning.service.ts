import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'node:crypto';
import {
  eventInput,
  occurrenceDates,
  textField,
  validDate,
} from './planning.validation';

const EVENT_COLUMNS = `e.id, e.team_id, e.title, e.kind, to_char(e.date,'YYYY-MM-DD') AS date,
  to_char(e.start_time,'HH24:MI') AS start_time, to_char(e.end_time,'HH24:MI') AS end_time,
  e.venue, e.notes, e.series_id, t.name AS team_name`;

@Injectable()
export class PlanningService {
  constructor(private readonly db: DataSource) {}

  async authorize(userId: string) {
    const [user] = await this.db.query(
      'SELECT role, status FROM users WHERE id=$1',
      [userId],
    );
    if (!user || user.role !== 'COACH' || user.status === 'SUSPENDED') {
      throw new ForbiddenException('A coach account is required.');
    }
  }
  async teams(userId: string) {
    await this.authorize(userId);
    return this.db.query(
      'SELECT * FROM coach_teams WHERE coach_id=$1 ORDER BY created_at, id',
      [userId],
    );
  }
  async saveTeam(userId: string, body: any, id?: string) {
    await this.authorize(userId);
    const values = [
      textField(body?.name, 'Team name', 100),
      textField(body?.age_group, 'Age group', 40),
      textField(body?.venue, 'Home venue', 160, false),
      userId,
    ];
    const rows = id
      ? await this.db.query(
          'WITH changed AS (UPDATE coach_teams SET name=$1, age_group=$2, venue=$3 WHERE coach_id=$4 AND id=$5 RETURNING *) SELECT * FROM changed',
          [...values, id],
        )
      : await this.db.query(
          'INSERT INTO coach_teams(name,age_group,venue,coach_id) VALUES($1,$2,$3,$4) RETURNING *',
          values,
        );
    if (!rows[0]) throw new NotFoundException('Team not found.');
    return rows[0];
  }
  async events(userId: string, from: string, to: string) {
    await this.authorize(userId);
    validDate(from);
    validDate(to);
    if (to < from || Date.parse(to) - Date.parse(from) > 93 * 86400000)
      throw new ConflictException('Select a range of up to three months.');
    return this.db.query(
      `SELECT ${EVENT_COLUMNS} FROM coach_schedule_events e JOIN coach_teams t ON t.id=e.team_id
      WHERE t.coach_id=$1 AND e.date BETWEEN $2 AND $3 ORDER BY e.date,e.start_time,e.id`,
      [userId, from, to],
    );
  }
  private async ownedTeam(tx: EntityManager, userId: string, teamId: string) {
    const [team] = await tx.query(
      'SELECT id FROM coach_teams WHERE id=$1 AND coach_id=$2 FOR UPDATE',
      [teamId, userId],
    );
    if (!team) throw new NotFoundException('Team not found.');
  }
  async saveEvents(
    userId: string,
    teamId: string,
    body: any,
    eventId?: string,
  ) {
    await this.authorize(userId);
    const data = eventInput(body);
    const dates = eventId
      ? [data.date]
      : occurrenceDates(data.date, body.repeat);
    return this.db.transaction(async (tx) => {
      // Serialize writes per team so two requests cannot create overlapping sessions.
      await this.ownedTeam(tx, userId, teamId);
      if (eventId) {
        const [existing] = await tx.query(
          'SELECT id FROM coach_schedule_events WHERE id=$1 AND team_id=$2',
          [eventId, teamId],
        );
        if (!existing) throw new NotFoundException('Session not found.');
      }
      const conflicts = await tx.query(
        `SELECT to_char(date,'YYYY-MM-DD') AS date FROM coach_schedule_events
        WHERE team_id=$1 AND date=ANY($2::date[]) AND start_time < $4::time AND end_time > $3::time
        AND ($5::uuid IS NULL OR id<>$5::uuid) ORDER BY date`,
        [teamId, dates, data.start_time, data.end_time, eventId || null],
      );
      if (conflicts.length)
        throw new ConflictException(
          `This team already has a session at that time on ${conflicts[0].date}. Choose another time; nothing was saved.`,
        );
      const series = dates.length > 1 ? randomUUID() : null;
      const saved: any[] = [];
      for (const date of dates) {
        const values = [
          teamId,
          data.title,
          data.kind,
          date,
          data.start_time,
          data.end_time,
          data.venue,
          data.notes,
        ];
        const [row] = eventId
          ? await tx.query(
              `WITH changed AS (UPDATE coach_schedule_events SET title=$2,kind=$3,date=$4,start_time=$5,end_time=$6,venue=$7,notes=$8
              WHERE team_id=$1 AND id=$9 RETURNING id) SELECT * FROM changed`,
              [...values, eventId],
            )
          : await tx.query(
              `INSERT INTO coach_schedule_events(team_id,title,kind,date,start_time,end_time,venue,notes,series_id)
              VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
              [...values, series],
            );
        saved.push(row);
      }
      return { count: saved.length, ids: saved.map((row) => row.id) };
    });
  }
  async deleteEvent(userId: string, teamId: string, eventId: string) {
    await this.authorize(userId);
    return this.db.transaction(async (tx) => {
      await this.ownedTeam(tx, userId, teamId);
      const rows = await tx.query(
        'WITH removed AS (DELETE FROM coach_schedule_events WHERE id=$1 AND team_id=$2 RETURNING id) SELECT * FROM removed',
        [eventId, teamId],
      );
      if (!rows[0]) throw new NotFoundException('Session not found.');
      return { deleted: true };
    });
  }
}
