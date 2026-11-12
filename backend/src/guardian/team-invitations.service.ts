import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { requiresParent, birthDate } from './invitation-age';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function invitationHash(value: unknown) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value))
    throw new BadRequestException('This invitation link is invalid.');
  return createHash('sha256').update(value).digest('hex');
}
const columns = `i.id,i.team_id,i.child_id,CASE WHEN i.status IN ('open','awaiting_parent','pending') AND i.expires_at<=now() THEN 'expired' WHEN i.status='pending' AND i.acceptance_mode='athlete' AND i.parent_required AND NOT EXISTS(SELECT 1 FROM guardian_links al JOIN users ag ON ag.id=al.guardian_id WHERE al.id=i.guardian_link_id AND al.guardian_id=i.guardian_id AND al.child_id=i.child_id AND al.status='accepted' AND al.updated_at<=i.parent_approved_at AND ag.role='GUARDIAN' AND ag.status IS DISTINCT FROM 'SUSPENDED') THEN 'approval_invalid' ELSE i.status END status,i.acceptance_mode,i.parent_required,i.parent_approved_at,i.created_at,i.expires_at,i.accepted_at,i.decided_at,t.name team_name,t.age_group,concat_ws(' ',c.first_name,c.last_name) coach_name,concat_ws(' ',g.first_name,g.last_name) parent_name,concat_ws(' ',u.first_name,u.last_name) child_name`;
const joins = `FROM team_invitations i JOIN coach_teams t ON t.id=i.team_id JOIN users c ON c.id=i.coach_id LEFT JOIN users g ON g.id=i.guardian_id LEFT JOIN users u ON u.id=i.child_id`;
@Injectable()
export class TeamInvitationsService {
  constructor(private readonly db: DataSource) {}
  async authorize(
    id: string,
    role: string,
    tx: DataSource | EntityManager = this.db,
  ) {
    const [u] = await tx.query('SELECT role,status FROM users WHERE id=$1', [
      id,
    ]);
    if (!u || u.role !== role || u.status === 'SUSPENDED')
      throw new ForbiddenException(
        'This account cannot manage these invitations.',
      );
  }
  async ownedTeam(
    id: string,
    team: string,
    tx: DataSource | EntityManager = this.db,
  ) {
    const [t] = await tx.query(
      'SELECT id,name FROM coach_teams WHERE id=$1 AND coach_id=$2 FOR UPDATE',
      [team, id],
    );
    if (!t) throw new NotFoundException('Team not found.');
    return t;
  }
  async create(id: string, team: string) {
    return this.db.transaction(async (tx) => {
      await this.authorize(id, 'COACH', tx);
      await this.ownedTeam(id, team, tx);
      const [{ count }] = await tx.query(
        "SELECT count(*) FROM team_invitations WHERE team_id=$1 AND created_at>now()-interval '1 day'",
        [team],
      );
      if (Number(count) >= 50)
        throw new ConflictException(
          'Invitation limit reached for today. Try again tomorrow.',
        );
      const token = randomBytes(32).toString('base64url');
      const [invite] = await tx.query(
        'INSERT INTO team_invitations(team_id,coach_id,token_hash) VALUES($1,$2,$3) RETURNING id,expires_at',
        [team, id, invitationHash(token)],
      );
      return { ...invite, token };
    });
  }
  async coachList(id: string, team: string) {
    await this.authorize(id, 'COACH');
    await this.ownedTeam(id, team);
    return this.db.query(
      `SELECT ${columns} ${joins} WHERE i.team_id=$1 AND i.coach_id=$2 ORDER BY i.created_at DESC LIMIT 100`,
      [team, id],
    );
  }
  async parentList(id: string) {
    await this.authorize(id, 'GUARDIAN');
    return this.db.query(
      `SELECT ${columns} ${joins} WHERE i.guardian_id=$1 OR (i.status='awaiting_parent' AND EXISTS(SELECT 1 FROM guardian_links l WHERE l.guardian_id=$1 AND l.child_id=i.child_id AND l.status='accepted')) ORDER BY i.created_at DESC LIMIT 100`,
      [id],
    );
  }
  async preview(id: string, token: unknown) {
    const [viewer] = await this.db.query(
      'SELECT role,status,date_of_birth::text FROM users WHERE id=$1',
      [id],
    );
    if (
      !viewer ||
      !['GUARDIAN', 'ATHLETE'].includes(viewer.role) ||
      viewer.status === 'SUSPENDED'
    )
      throw new ForbiddenException(
        'Sign in as a parent or athlete to accept an invitation.',
      );
    // A link reveals only the inviting coach and team, never players, contacts or schedule.
    const [i] = await this.db.query(
      `SELECT i.id,t.name team_name,t.age_group,concat_ws(' ',c.first_name,c.last_name) coach_name,i.expires_at FROM team_invitations i JOIN coach_teams t ON t.id=i.team_id AND t.coach_id=i.coach_id JOIN users c ON c.id=i.coach_id WHERE i.token_hash=$1 AND i.status='open' AND i.expires_at>now() AND c.role='COACH' AND c.status IS DISTINCT FROM 'SUSPENDED'`,
      [invitationHash(token)],
    );
    if (!i)
      throw new NotFoundException(
        'This invitation has expired, been used or been withdrawn. Ask the coach for a new one.',
      );
    return {
      ...i,
      role: viewer.role,
      date_of_birth:
        viewer.role === 'ATHLETE' ? viewer.date_of_birth : undefined,
      parent_required:
        viewer.role === 'ATHLETE'
          ? requiresParent(viewer.date_of_birth)
          : undefined,
    };
  }
  async managed(tx: EntityManager, parent: string, child: string) {
    const [link] = await tx.query(
      `SELECT u.id,u.first_name,u.last_name FROM guardian_links l JOIN users u ON u.id=l.child_id JOIN users g ON g.id=l.guardian_id WHERE l.guardian_id=$1 AND l.child_id=$2 AND l.mode='managed' AND l.status='accepted' AND g.role='GUARDIAN' AND g.status IS DISTINCT FROM 'SUSPENDED' AND u.role='ATHLETE' AND u.status IS DISTINCT FROM 'SUSPENDED' FOR UPDATE OF l,u,g`,
      [parent, child],
    );
    if (!link)
      throw new ForbiddenException(
        'Choose a child you currently manage. Read-only athlete links cannot accept team invitations.',
      );
    return link;
  }
  async accept(id: string, body: any) {
    const hash = invitationHash(body?.token);
    if (!uuid.test(body?.child_id || '') || body?.consent !== true)
      throw new BadRequestException(
        'Select your child and confirm the team permissions.',
      );
    return this.db.transaction(async (tx) => {
      await this.authorize(id, 'GUARDIAN', tx);
      const [i] = await tx.query(
        'SELECT * FROM team_invitations WHERE token_hash=$1 FOR UPDATE',
        [hash],
      );
      if (
        !i ||
        i.status !== 'open' ||
        new Date(i.expires_at).getTime() <= Date.now()
      )
        throw new ConflictException(
          'This invitation is no longer available. Ask the coach for a new one.',
        );
      await this.authorize(i.coach_id, 'COACH', tx);
      const [team] = await tx.query(
        'SELECT id FROM coach_teams WHERE id=$1 AND coach_id=$2',
        [i.team_id, i.coach_id],
      );
      if (!team)
        throw new NotFoundException('This invitation is no longer available.');
      await this.managed(tx, id, body.child_id);
      const [existing] = await tx.query(
        `SELECT 1 FROM coach_player_accounts WHERE team_id=$1 AND user_id=$2 UNION ALL SELECT 1 FROM team_invitations WHERE team_id=$1 AND child_id=$2 AND status IN ('pending','awaiting_parent') AND expires_at>now()`,
        [i.team_id, body.child_id],
      );
      if (existing)
        throw new ConflictException(
          'This child is already linked to this team or has a pending request.',
        );
      await tx.query(
        "UPDATE team_invitations SET status='pending',guardian_id=$2,child_id=$3,accepted_at=now() WHERE id=$1",
        [i.id, id, body.child_id],
      );
      return { id: i.id, status: 'pending' };
    });
  }
  async decide(id: string, team: string, invite: string, body: any) {
    if (!['confirmed', 'declined', 'revoked'].includes(body?.status))
      throw new BadRequestException('Choose confirm, decline or revoke.');
    if (body.player_id && !uuid.test(body.player_id))
      throw new BadRequestException('Choose a roster player.');
    return this.db.transaction(async (tx) => {
      await this.authorize(id, 'COACH', tx);
      await this.ownedTeam(id, team, tx);
      const [i] = await tx.query(
        'SELECT * FROM team_invitations WHERE id=$1 AND team_id=$2 AND coach_id=$3 FOR UPDATE',
        [invite, team, id],
      );
      if (!i) throw new NotFoundException('Invitation not found.');
      if (
        !['open', 'awaiting_parent', 'pending'].includes(i.status) ||
        new Date(i.expires_at).getTime() <= Date.now()
      )
        throw new ConflictException('This invitation is no longer active.');
      if (body.status !== 'revoked' && i.status !== 'pending')
        throw new ConflictException(
          'Athlete acceptance and any required parent approval must be completed before coach review.',
        );
      if (body.status === 'confirmed') {
        const child =
          i.acceptance_mode === 'athlete'
            ? await this.confirmableAthlete(tx, i)
            : await this.managed(tx, i.guardian_id, i.child_id);
        const [existing] = await tx.query(
          'SELECT 1 FROM coach_player_accounts WHERE team_id=$1 AND user_id=$2',
          [team, child.id],
        );
        if (existing)
          throw new ConflictException(
            'This child is already linked to a roster player in this team.',
          );
        let player = body.player_id;
        if (player) {
          const [p] = await tx.query(
            "SELECT id FROM coach_team_players WHERE id=$1 AND team_id=$2 AND status='active' FOR UPDATE",
            [player, team],
          );
          if (!p)
            throw new BadRequestException(
              'Choose an active player from this team.',
            );
          const [used] = await tx.query(
            'SELECT 1 FROM coach_player_accounts WHERE player_id=$1 UNION ALL SELECT 1 FROM coach_session_attendance WHERE player_id=$1 AND user_id IS NOT NULL AND user_id<>$2',
            [player, child.id],
          );
          if (used)
            throw new ConflictException(
              'This roster entry is linked or has another athlete’s history. Choose another entry or create a new one.',
            );
        } else {
          const [p] = await tx.query(
            'INSERT INTO coach_team_players(team_id,first_name,last_name) VALUES($1,$2,$3) RETURNING id',
            [team, child.first_name, child.last_name],
          );
          player = p.id;
        }
        await tx.query(
          'INSERT INTO coach_player_accounts(player_id,team_id,user_id) VALUES($1,$2,$3)',
          [player, team, child.id],
        );
        await tx.query(
          'UPDATE coach_session_attendance SET user_id=$1 WHERE player_id=$2 AND user_id IS NULL',
          [child.id, player],
        );
      }
      await tx.query(
        'UPDATE team_invitations SET status=$2,decided_at=now() WHERE id=$1',
        [invite, body.status],
      );
      return { status: body.status };
    });
  }
  async withdraw(id: string, invite: string) {
    await this.authorize(id, 'GUARDIAN');
    const rows = await this.db.query(
      "WITH updated AS (UPDATE team_invitations SET status='withdrawn',decided_at=now() WHERE id=$1 AND guardian_id=$2 AND status='pending' RETURNING id) SELECT * FROM updated",
      [invite, id],
    );
    if (!rows.length)
      throw new ConflictException('This request is no longer pending.');
    return { status: 'withdrawn' };
  }
  async athleteList(id: string) {
    await this.authorize(id, 'ATHLETE');
    return this.db.query(
      `SELECT ${columns} ${joins} WHERE i.child_id=$1 AND i.acceptance_mode='athlete' ORDER BY i.created_at DESC LIMIT 100`,
      [id],
    );
  }
  async acceptAthlete(id: string, body: any) {
    const hash = invitationHash(body?.token);
    if (
      body?.consent !== true ||
      Object.keys(body).some(
        (k) => !['token', 'consent', 'date_of_birth'].includes(k),
      )
    )
      throw new BadRequestException('Confirm that you want to join this team.');
    return this.db.transaction(async (tx) => {
      await this.authorize(id, 'ATHLETE', tx);
      const [i] = await tx.query(
        'SELECT * FROM team_invitations WHERE token_hash=$1 FOR UPDATE',
        [hash],
      );
      if (
        !i ||
        i.status !== 'open' ||
        new Date(i.expires_at).getTime() <= Date.now()
      )
        throw new ConflictException('This invitation is no longer available.');
      await this.authorize(i.coach_id, 'COACH', tx);
      const [team] = await tx.query(
        'SELECT id FROM coach_teams WHERE id=$1 AND coach_id=$2',
        [i.team_id, i.coach_id],
      );
      if (!team) throw new NotFoundException('Team not found.');
      const [user] = await tx.query(
        "SELECT id,date_of_birth::text,email FROM users WHERE id=$1 AND role='ATHLETE' AND status IS DISTINCT FROM 'SUSPENDED' FOR UPDATE",
        [id],
      );
      if (!user?.email)
        throw new ForbiddenException(
          'A parent must accept for a managed child.',
        );
      if (
        user.date_of_birth &&
        body.date_of_birth &&
        body.date_of_birth !== user.date_of_birth
      )
        throw new BadRequestException(
          'Your recorded date of birth cannot be changed through an invitation. Contact support if it needs correcting.',
        );
      const dob = user.date_of_birth || birthDate(body.date_of_birth);
      const parentRequired = requiresParent(dob);
      const [existing] = await tx.query(
        "SELECT 1 FROM coach_player_accounts WHERE team_id=$1 AND user_id=$2 UNION ALL SELECT 1 FROM team_invitations WHERE team_id=$1 AND child_id=$2 AND status IN ('pending','awaiting_parent') AND expires_at>now()",
        [i.team_id, id],
      );
      if (existing)
        throw new ConflictException(
          'You are already linked to this team or have a pending request.',
        );
      if (!user.date_of_birth)
        await tx.query(
          'UPDATE users SET date_of_birth=$2 WHERE id=$1 AND date_of_birth IS NULL',
          [id, dob],
        );
      const status = parentRequired ? 'awaiting_parent' : 'pending';
      await tx.query(
        "UPDATE team_invitations SET acceptance_mode='athlete',child_id=$2,parent_required=$3,status=$4,accepted_at=now() WHERE id=$1",
        [i.id, id, parentRequired, status],
      );
      return { id: i.id, status };
    });
  }
  async approveParent(id: string, invite: string, body: any) {
    if (
      !['approved', 'declined'].includes(body?.status) ||
      (body.status === 'approved' && body.guardian_confirmed !== true)
    )
      throw new BadRequestException(
        'Confirm that you are the parent or legal guardian before approving.',
      );
    return this.db.transaction(async (tx) => {
      await this.authorize(id, 'GUARDIAN', tx);
      const [i] = await tx.query(
        'SELECT * FROM team_invitations WHERE id=$1 FOR UPDATE',
        [invite],
      );
      if (
        !i ||
        i.acceptance_mode !== 'athlete' ||
        i.status !== 'awaiting_parent' ||
        new Date(i.expires_at).getTime() <= Date.now()
      )
        throw new ConflictException(
          'This invitation is no longer awaiting parent approval.',
        );
      // Same lock order as athlete revocation: link first, then users.
      const [link] = await tx.query(
        "SELECT id FROM guardian_links WHERE guardian_id=$1 AND child_id=$2 AND status='accepted' FOR UPDATE",
        [id, i.child_id],
      );
      if (!link)
        throw new ForbiddenException(
          'An accepted parent link is required to review this invitation.',
        );
      await this.authorize(i.child_id, 'ATHLETE', tx);
      await this.authorize(i.coach_id, 'COACH', tx);
      await tx.query(
        "UPDATE team_invitations SET guardian_id=$2,guardian_link_id=$3,parent_approved_at=CASE WHEN $4='pending' THEN now() ELSE NULL END,status=$4,decided_at=CASE WHEN $4='declined' THEN now() ELSE NULL END WHERE id=$1",
        [
          invite,
          id,
          link.id,
          body.status === 'approved' ? 'pending' : 'declined',
        ],
      );
      return { status: body.status === 'approved' ? 'pending' : 'declined' };
    });
  }
  async confirmableAthlete(tx: EntityManager, invite: any) {
    // Recheck live approval and age, including a parent link revoked after approval.
    if (invite.parent_required) {
      const [link] = await tx.query(
        "SELECT l.id FROM guardian_links l JOIN users g ON g.id=l.guardian_id WHERE l.id=$1 AND l.guardian_id=$2 AND l.child_id=$3 AND l.status='accepted' AND l.updated_at<=$4 AND g.role='GUARDIAN' AND g.status IS DISTINCT FROM 'SUSPENDED' FOR UPDATE OF l,g",
        [
          invite.guardian_link_id,
          invite.guardian_id,
          invite.child_id,
          invite.parent_approved_at,
        ],
      );
      if (!link || !invite.parent_approved_at)
        throw new ForbiddenException(
          'Parent approval is missing or the parent link has changed. Ask the athlete to withdraw and use a new invitation.',
        );
    }
    const [athlete] = await tx.query(
      "SELECT id,first_name,last_name,date_of_birth::text FROM users WHERE id=$1 AND role='ATHLETE' AND status IS DISTINCT FROM 'SUSPENDED' FOR UPDATE",
      [invite.child_id],
    );
    if (!athlete)
      throw new ForbiddenException('This athlete account is unavailable.');
    if (requiresParent(athlete.date_of_birth) && !invite.parent_required)
      throw new ForbiddenException(
        'Parent approval is required. Ask the athlete to use a new invitation.',
      );
    return athlete;
  }
  async withdrawAthlete(id: string, invite: string) {
    await this.authorize(id, 'ATHLETE');
    const rows = await this.db.query(
      "WITH updated AS (UPDATE team_invitations SET status='withdrawn',decided_at=now() WHERE id=$1 AND child_id=$2 AND acceptance_mode='athlete' AND status IN ('awaiting_parent','pending') RETURNING id) SELECT * FROM updated",
      [invite, id],
    );
    if (!rows.length)
      throw new ConflictException('This invitation is no longer pending.');
    return { status: 'withdrawn' };
  }
}
