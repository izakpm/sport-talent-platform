import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchoolsService {
  constructor(private readonly db: DataSource) {}
  async workspace(userId: string) {
    const [user] = await this.db.query('SELECT role FROM users WHERE id=$1', [
      userId,
    ]);
    if (!user || !['SCHOOL', 'ORG'].includes(user.role))
      throw new ForbiddenException('A school account is required.');
    const [school] = await this.db.query(
      `SELECT o.id,o.name,o.location,p.division,p.province,p.logo_url,p.source_url,p.is_demo
      FROM organisation_users m JOIN organisations o ON o.id=m.organisation_id
      JOIN school_competition_profiles p ON p.organisation_id=o.id
      WHERE m.user_id=$1 ORDER BY o.name LIMIT 1`,
      [userId],
    );
    if (!school) return { school: null, teams: [], fixtures: [] };
    const teams = await this.db.query(
      `SELECT id,name,season,sport,source_url FROM school_competition_teams
      WHERE organisation_id=$1 ORDER BY season DESC,name`,
      [school.id],
    );
    const fixtures = await this.db.query(
      `SELECT f.id,f.match_date::text,f.division,f.competition,f.home_score,f.away_score,
      f.venue,f.round,f.decision_note,f.source_url,f.source_label,f.additional_sources,
      h.id AS home_team_id,h.name AS home_team,ho.id AS home_school_id,ho.name AS home_school,
      a.id AS away_team_id,a.name AS away_team,ao.id AS away_school_id,ao.name AS away_school
      FROM school_competition_fixtures f
      JOIN school_competition_teams h ON h.id=f.home_team_id JOIN organisations ho ON ho.id=h.organisation_id
      JOIN school_competition_teams a ON a.id=f.away_team_id JOIN organisations ao ON ao.id=a.organisation_id
      WHERE h.organisation_id=$1 OR a.organisation_id=$1 ORDER BY f.match_date DESC,h.name,f.id`,
      [school.id],
    );
    const coaches = await this.db.query(
      `SELECT DISTINCT u.id,u.first_name,u.last_name,u.profile_image
       FROM organisation_users m JOIN users u ON u.id=m.user_id
       WHERE m.organisation_id=$1 AND u.role='COACH'
       ORDER BY u.first_name,u.last_name,u.id`,
      [school.id],
    );
    return { school, teams, fixtures, coaches };
  }
}
