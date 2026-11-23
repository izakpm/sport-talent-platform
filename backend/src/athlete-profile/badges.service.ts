import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AthleteProfileService } from './profile.service';

export const TRAINING_MILESTONES = [10, 25, 50, 100, 250];
type Interval = { starts_at: string | Date; ends_at: string | Date };
export function trainingMilestones(records: Interval[], now = Date.now()) {
  const intervals = records
    .map((r) => [
      new Date(r.starts_at).getTime(),
      new Date(r.ends_at).getTime(),
    ])
    .filter(
      ([start, end]) =>
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        end > start &&
        end <= now &&
        end - start <= 86400000,
    )
    .sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];
  for (const [start, end] of intervals) {
    const last = merged.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  const totalMinutes = Math.floor(
    merged.reduce((sum, [start, end]) => sum + (end - start) / 60000, 0),
  );
  const milestones = TRAINING_MILESTONES.map((hours) => {
    let left = hours * 60000 * 60,
      reached: string | null = null;
    for (const [start, end] of merged) {
      if (left <= end - start) {
        reached = new Date(start + left).toISOString();
        break;
      }
      left -= end - start;
    }
    return {
      id: `training-${hours}`,
      kind: 'training',
      title: `${hours}-hour club`,
      hours,
      earned: totalMinutes >= hours * 60,
      achieved_at: reached,
    };
  });
  const next = TRAINING_MILESTONES.find((h) => totalMinutes < h * 60) ?? null;
  return {
    verified_minutes: totalMinutes,
    next_hours: next,
    remaining_minutes: next === null ? 0 : next * 60 - totalMinutes,
    milestones,
  };
}
export function selectionBadges(entries: any[]) {
  return entries
    .filter(
      (e) =>
        e.kind === 'achievement' && e.achievement_type === 'team_selection',
    )
    .flatMap((e) => {
      const base = {
        entry_id: e.id,
        achievement: e.title,
        organisation: e.organisation_name || e.organization,
        organisation_id: e.organisation_id || null,
        logo_url: e.organisation_logo_url || null,
        earned: e.verification_status === 'verified',
        verification_status: e.verification_status,
        coach_name: e.verification_coach_name,
        verified_at: e.reviewed_at,
        season: e.date.slice(0, 4),
      };
      const badges: any[] = [];
      if (e.selection_level === 'provincial')
        badges.push({
          ...base,
          id: `provincial-${e.id}`,
          kind: 'provincial',
          title: 'Provincial selection',
          achieved_at: e.date,
        });
      if (e.leadership_role === 'Captain')
        badges.push({
          ...base,
          id: `captain-${e.id}`,
          kind: 'captain',
          title: 'Team captain',
          achieved_at: e.leadership_date || null,
          season: (e.leadership_date || e.date).slice(0, 4),
        });
      return badges;
    });
}
export function annualTrainingMilestones(
  records: Interval[],
  now = Date.now(),
) {
  const yearOf = (time: number) => new Date(time + 7200000).getUTCFullYear();
  const year = yearOf(now);
  const byYear = new Map<number, Interval[]>();
  for (const record of records) {
    let start = new Date(record.starts_at).getTime();
    const end = new Date(record.ends_at).getTime();
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      end <= start ||
      end > now ||
      end - start > 86400000
    )
      continue;
    while (start < end) {
      const season = yearOf(start);
      const stop = Math.min(end, Date.UTC(season + 1, 0, 1) - 7200000);
      const rows = byYear.get(season) || [];
      rows.push({ starts_at: new Date(start), ends_at: new Date(stop) });
      byYear.set(season, rows);
      start = stop;
    }
  }
  if (!byYear.has(year)) byYear.set(year, []);
  const seasons = [...byYear.keys()]
    .sort((a, b) => b - a)
    .map((season) => ({
      year: season,
      ...trainingMilestones(byYear.get(season)!, now),
    }));
  const current = seasons.find((s) => s.year === year)!;
  return {
    ...current,
    milestones: current.milestones.map((b) => ({
      ...b,
      id: `${b.id}-${year}`,
      season: String(year),
    })),
    awards: seasons.flatMap((s) =>
      s.milestones
        .filter((b) => b.earned)
        .map((b) => ({
          ...b,
          id: `${b.id}-${s.year}`,
          season: String(s.year),
        })),
    ),
  };
}
@Injectable()
export class BadgesService {
  constructor(
    private readonly db: DataSource,
    private readonly profiles: AthleteProfileService,
  ) {}
  async get(userId: string) {
    const profile = await this.profiles.get(userId);
    const records = await this.db.query(
      `
      SELECT a.start_time AT TIME ZONE 'Africa/Johannesburg' AS starts_at,
             (a.start_time+a.duration_minutes*interval '1 minute') AT TIME ZONE 'Africa/Johannesburg' AS ends_at
      FROM activities a JOIN athlete_profiles ap ON ap.id=a.athlete_id
      LEFT JOIN activity_types at ON at.id=a.activity_type_id
      LEFT JOIN activity_coach_requests r ON r.activity_id=a.id
      WHERE ap.user_id=$1 AND a.duration_minutes>0 AND a.duration_minutes<=1440
        AND lower(coalesce(a.training_kind,at.name,'')) NOT LIKE '%match%'
        AND (r.status='verified' OR (r.activity_id IS NULL AND EXISTS(SELECT 1 FROM activity_verifications v WHERE v.activity_id=a.id AND v.status='VERIFIED')))
      UNION ALL
      SELECT (e.date+e.start_time) AT TIME ZONE t.timezone AS starts_at,
             (e.date+e.end_time) AT TIME ZONE t.timezone AS ends_at
      FROM coach_session_attendance att JOIN coach_schedule_events e ON e.id=att.event_id
      JOIN coach_teams t ON t.id=e.team_id
      WHERE att.status='verified' AND NOT e.cancelled AND e.kind<>'match'
        AND (att.user_id=$1 OR (att.user_id IS NULL AND EXISTS(SELECT 1 FROM coach_player_accounts m WHERE m.player_id=att.player_id AND m.user_id=$1)))`,
      [userId],
    );
    return {
      training: annualTrainingMilestones(records),
      sporting: selectionBadges(profile.entries),
    };
  }
}
