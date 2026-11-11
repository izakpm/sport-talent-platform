import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HubService } from './hub.service';
@Injectable()
export class ConnectionsService {
  constructor(
    private readonly db: DataSource,
    private readonly hub: HubService,
  ) {}
  async list(userId: string) {
    await this.hub.authorize(userId, 'ATHLETE');
    const rows = await this.db.query(
      `WITH my_teams AS (
 SELECT t.id,t.name,t.age_group,t.sport,t.coach_id FROM coach_teams t
 JOIN coach_player_accounts a ON a.team_id=t.id
 JOIN coach_team_players p ON p.id=a.player_id AND p.team_id=t.id
 WHERE a.user_id=$1 AND p.status='active'
 ), people AS (
 SELECT t.id team_id,u.id,u.first_name,u.last_name,u.profile_image,'coach' role
 FROM my_teams t JOIN users u ON u.id=t.coach_id WHERE u.role='COACH' AND u.status IS DISTINCT FROM 'SUSPENDED'
 UNION ALL
 SELECT t.id team_id,u.id,u.first_name,u.last_name,u.profile_image,'teammate' role
 FROM my_teams t JOIN coach_player_accounts a ON a.team_id=t.id
 JOIN coach_team_players p ON p.id=a.player_id AND p.team_id=t.id
 JOIN users u ON u.id=a.user_id
 WHERE p.status='active' AND u.role='ATHLETE' AND u.status IS DISTINCT FROM 'SUSPENDED' AND u.id<>$1
 ) SELECT t.id team_id,t.name team_name,t.age_group,t.sport,c.id,c.first_name,c.last_name,c.profile_image,c.role
 FROM my_teams t LEFT JOIN people c ON c.team_id=t.id ORDER BY t.name,c.last_name,c.first_name,c.id`,
      [userId],
    );
    const teams = new Map<string, any>(),
      people = new Map<string, any>();
    for (const r of rows) {
      teams.set(r.team_id, {
        id: r.team_id,
        name: r.team_name,
        age_group: r.age_group,
        sport: r.sport,
      });
      if (!r.id) continue;
      if (!people.has(r.id))
        people.set(r.id, {
          id: r.id,
          name:
            [r.first_name, r.last_name].filter(Boolean).join(' ').trim() ||
            (r.role === 'coach' ? 'Team coach' : 'Teammate'),
          profile_image: r.profile_image || null,
          role: r.role,
          team_ids: [],
        });
      const p = people.get(r.id);
      if (!p.team_ids.includes(r.team_id)) p.team_ids.push(r.team_id);
    }
    return {
      teams: [...teams.values()],
      people: [...people.values()].sort(
        (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
      ),
    };
  }
}
