import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HubService } from '../team-hub/hub.service';
export function matchInput(body: any, personal = false) {
  const fields = personal
    ? [
        'position',
        'minutes',
        'tries',
        'tackles',
        'conversions',
        'penalties',
        'video_url',
        'notes',
      ]
    : ['opponent', 'team_score', 'opponent_score'];
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((k) => !fields.includes(k))
  )
    throw new BadRequestException('Enter valid match details.');
  const text = (key: string, max: number) => {
    const v = body[key] ?? '';
    if (typeof v !== 'string' || v.trim().length > max)
      throw new BadRequestException(`Check ${key}.`);
    return v.trim();
  };
  const number = (key: string, max: number, optional = false) => {
    const v = body[key];
    if (optional && (v === null || v === undefined || v === '')) return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > max)
      throw new BadRequestException(`Check ${key.replaceAll('_', ' ')}.`);
    return v;
  };
  if (!personal) {
    const opponent = text('opponent', 120);
    if (!opponent) throw new BadRequestException('Enter the opponent.');
    return {
      opponent,
      team_score: number('team_score', 999),
      opponent_score: number('opponent_score', 999),
    };
  }
  const video_url = text('video_url', 2000);
  if (video_url) {
    try {
      const u = new URL(video_url);
      if (!['https:', 'http:'].includes(u.protocol) || u.username || u.password)
        throw new Error();
    } catch {
      throw new BadRequestException(
        'Use a valid https:// or http:// video link.',
      );
    }
  }
  return {
    position: text('position', 80),
    minutes: number('minutes', 180, true),
    tries: number('tries', 50, true),
    tackles: number('tackles', 200, true),
    conversions: number('conversions', 100, true),
    penalties: number('penalties', 100, true),
    video_url,
    notes: text('notes', 2000),
  };
}
@Injectable()
export class MatchesService {
  constructor(
    private readonly db: DataSource,
    private readonly hub: HubService,
  ) {}
  async list(userId: string) {
    const role = await this.hub.authorize(userId);
    return this.db.query(
      `SELECT e.id,e.team_id,e.title,e.cancelled,to_char(e.date,'YYYY-MM-DD') date,to_char(e.start_time,'HH24:MI') start_time,to_char(e.end_time,'HH24:MI') end_time,e.venue,e.notes,t.name team_name,t.timezone,t.sport,(e.date+e.start_time) AT TIME ZONE t.timezone starts_at,(e.date+e.end_time) AT TIME ZONE t.timezone ends_at,
 CASE WHEN r.event_id IS NULL THEN NULL ELSE jsonb_build_object('opponent',r.opponent,'team_score',r.team_score,'opponent_score',r.opponent_score,'updated_at',r.updated_at) END result,
 CASE WHEN s.event_id IS NULL THEN NULL ELSE to_jsonb(s)-'user_id'-'event_id' END stats
 FROM coach_schedule_events e JOIN coach_teams t ON t.id=e.team_id LEFT JOIN match_results r ON r.event_id=e.id LEFT JOIN athlete_match_stats s ON s.event_id=e.id AND s.user_id=$1
 WHERE e.kind='match' AND ${role === 'COACH' ? 't.coach_id=$1' : `(EXISTS(SELECT 1 FROM coach_player_accounts a JOIN coach_team_players p ON p.id=a.player_id WHERE a.team_id=t.id AND a.user_id=$1 AND p.status='active') OR s.user_id=$1)`} ORDER BY e.date DESC,e.start_time DESC,e.id`,
      [userId],
    );
  }
  async save(userId: string, id: string, body: any, personal = false) {
    const v: any = matchInput(body, personal);
    await this.db.transaction(async (tx) => {
      await this.hub.authorize(userId, personal ? 'ATHLETE' : 'COACH', tx);
      const [e] = await tx.query(
        `SELECT e.*,t.coach_id,(e.date+e.end_time) AT TIME ZONE t.timezone ends_at FROM coach_schedule_events e JOIN coach_teams t ON t.id=e.team_id WHERE e.id=$1 AND e.kind='match' FOR UPDATE OF e`,
        [id],
      );
      if (!e) throw new NotFoundException('Match not found.');
      if (personal) {
        const [existing] = await tx.query(
          'SELECT 1 FROM athlete_match_stats WHERE event_id=$1 AND user_id=$2',
          [id, userId],
        );
        if (!existing) await this.hub.member(userId, e.team_id, tx);
      } else if (e.coach_id !== userId)
        throw new NotFoundException('Match not found.');
      if (e.cancelled || new Date(e.ends_at).getTime() > Date.now())
        throw new ConflictException(
          'Results and performance details can be recorded after an uncancelled match has ended.',
        );
      if (personal) {
        const [result] = await tx.query(
          'SELECT 1 FROM match_results WHERE event_id=$1',
          [id],
        );
        if (!result)
          throw new ConflictException(
            'Your coach needs to record the team result first.',
          );
        await tx.query(
          `INSERT INTO athlete_match_stats(event_id,user_id,position,minutes,tries,tackles,conversions,penalties,video_url,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(event_id,user_id) DO UPDATE SET position=$3,minutes=$4,tries=$5,tackles=$6,conversions=$7,penalties=$8,video_url=$9,notes=$10,updated_at=now()`,
          [
            id,
            userId,
            v.position,
            v.minutes,
            v.tries,
            v.tackles,
            v.conversions,
            v.penalties,
            v.video_url,
            v.notes,
          ],
        );
      } else
        await tx.query(
          `INSERT INTO match_results(event_id,opponent,team_score,opponent_score,recorded_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(event_id) DO UPDATE SET opponent=$2,team_score=$3,opponent_score=$4,recorded_by=$5,updated_at=now()`,
          [id, v.opponent, v.team_score, v.opponent_score, userId],
        );
    });
    return (await this.list(userId)).find((e: any) => e.id === id);
  }
}
