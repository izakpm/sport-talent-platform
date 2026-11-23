import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { note } from '../activities/activity.validation';

export const ACHIEVEMENT_LINK = `EXISTS(SELECT 1 FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id JOIN coach_teams t ON t.id=m.team_id WHERE m.user_id=e.user_id AND t.coach_id=r.coach_id AND p.status='active')`;
export function achievementRequestInput(body: any) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((k) => !['coach_id', 'note'].includes(k)) ||
    typeof body.coach_id !== 'string' ||
    !/^[0-9a-f-]{36}$/i.test(body.coach_id)
  )
    throw new BadRequestException('Choose a linked coach.');
  return { coach_id: body.coach_id, note: note(body.note) };
}
export function achievementDecisionInput(body: any) {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((k) => !['status', 'note'].includes(k)) ||
    !['verified', 'declined'].includes(body.status)
  )
    throw new BadRequestException('Verify or decline the achievement.');
  const message = note(body.note);
  if (body.status === 'declined' && !message)
    throw new BadRequestException('Explain what needs to be corrected.');
  return { status: body.status, note: message };
}
@Injectable()
export class AchievementVerificationService {
  constructor(private readonly db: DataSource) {}
  async authorize(id: string, role: string, tx: any = this.db) {
    const [u] = await tx.query('SELECT role,status FROM users WHERE id=$1', [
      id,
    ]);
    if (!u || u.role !== role || u.status === 'SUSPENDED')
      throw new ForbiddenException(
        `An active ${role.toLowerCase()} account is required.`,
      );
  }
  async coaches(userId: string) {
    await this.authorize(userId, 'ATHLETE');
    return this.db.query(
      `SELECT c.id,concat_ws(' ',c.first_name,c.last_name) AS name,string_agg(DISTINCT t.name,', ' ORDER BY t.name) AS teams FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id JOIN coach_teams t ON t.id=m.team_id JOIN users c ON c.id=t.coach_id WHERE m.user_id=$1 AND p.status='active' AND c.role='COACH' AND c.status IS DISTINCT FROM 'SUSPENDED' GROUP BY c.id ORDER BY name`,
      [userId],
    );
  }
  async owned(tx: any, userId: string, id: string) {
    const [e] = await tx.query(
      "SELECT id FROM athlete_portfolio_entries WHERE id=$1 AND user_id=$2 AND kind='achievement' FOR UPDATE",
      [id, userId],
    );
    if (!e) throw new NotFoundException('Achievement not found.');
    const [r] = await tx.query(
      'SELECT status,coach_id FROM achievement_coach_requests WHERE entry_id=$1',
      [id],
    );
    return r;
  }
  async request(userId: string, id: string, body: any) {
    const input = achievementRequestInput(body);
    await this.db.transaction(async (tx) => {
      await this.authorize(userId, 'ATHLETE', tx);
      const r = await this.owned(tx, userId, id);
      if (r?.status === 'verified')
        throw new ConflictException('This achievement is already verified.');
      const [coach] = await tx.query(
        `SELECT c.id FROM users c WHERE c.id=$2 AND c.role='COACH' AND c.status IS DISTINCT FROM 'SUSPENDED' AND EXISTS(SELECT 1 FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id JOIN coach_teams t ON t.id=m.team_id WHERE m.user_id=$1 AND t.coach_id=c.id AND p.status='active')`,
        [userId, input.coach_id],
      );
      if (!coach)
        throw new ForbiddenException(
          'Choose a coach linked to your active team roster.',
        );
      if (r?.status === 'pending') {
        if (r.coach_id !== coach.id)
          throw new ConflictException(
            'Withdraw the existing request before choosing another coach.',
          );
        return;
      }
      await tx.query(
        "INSERT INTO achievement_coach_requests(entry_id,coach_id,status,request_note) VALUES($1,$2,'pending',$3) ON CONFLICT(entry_id) DO UPDATE SET coach_id=$2,status='pending',request_note=$3,review_note='',requested_at=now(),reviewed_at=null",
        [id, coach.id, input.note],
      );
    });
    return { status: 'pending' };
  }
  async withdraw(userId: string, id: string) {
    await this.db.transaction(async (tx) => {
      await this.authorize(userId, 'ATHLETE', tx);
      const r = await this.owned(tx, userId, id);
      if (r?.status !== 'pending')
        throw new ConflictException('Only pending requests can be withdrawn.');
      await tx.query(
        'DELETE FROM achievement_coach_requests WHERE entry_id=$1',
        [id],
      );
    });
    return { status: 'self_reported' };
  }
  async pending(coachId: string) {
    await this.authorize(coachId, 'COACH');
    return this.db.query(
      `SELECT e.id,e.title,e.date::text,e.organization,e.notes,e.achievement_type,e.leadership_role,e.leadership_date::text,e.user_id,concat_ws(' ',u.first_name,u.last_name) AS athlete_name,r.request_note,r.requested_at FROM achievement_coach_requests r JOIN athlete_portfolio_entries e ON e.id=r.entry_id JOIN users u ON u.id=e.user_id WHERE r.coach_id=$1 AND r.status='pending' AND e.kind='achievement' AND u.status IS DISTINCT FROM 'SUSPENDED' AND ${ACHIEVEMENT_LINK} ORDER BY r.requested_at`,
      [coachId],
    );
  }
  async decide(coachId: string, id: string, body: any) {
    const input = achievementDecisionInput(body);
    await this.db.transaction(async (tx) => {
      await this.authorize(coachId, 'COACH', tx);
      await tx.query(
        'SELECT id FROM athlete_portfolio_entries WHERE id=$1 FOR UPDATE',
        [id],
      );
      const [r] = await tx.query(
        `SELECT r.status FROM achievement_coach_requests r JOIN athlete_portfolio_entries e ON e.id=r.entry_id JOIN users u ON u.id=e.user_id WHERE e.id=$1 AND r.coach_id=$2 AND e.kind='achievement' AND u.status IS DISTINCT FROM 'SUSPENDED' AND ${ACHIEVEMENT_LINK}`,
        [id, coachId],
      );
      if (!r)
        throw new NotFoundException(
          'Request not found for your active roster.',
        );
      if (r.status !== 'pending')
        throw new ConflictException(
          'This request has already been reviewed or withdrawn.',
        );
      await tx.query(
        'UPDATE achievement_coach_requests SET status=$2,review_note=$3,reviewed_at=now() WHERE entry_id=$1',
        [id, input.status, input.note],
      );
    });
    return this.pending(coachId);
  }
}
