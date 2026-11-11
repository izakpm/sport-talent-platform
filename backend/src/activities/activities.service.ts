import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { activityInput, note, TRAINING_KINDS } from './activity.validation';
const LINK = `EXISTS(SELECT 1 FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id JOIN coach_teams t ON t.id=m.team_id WHERE m.user_id=ap.user_id AND t.coach_id=r.coach_id AND p.status='active')`;
const SELECT = `a.id,a.title,a.sport_id,s.name AS sport,coalesce(a.training_kind,at.name,'Training') AS training_kind,a.description,a.location,to_char(a.start_time,'YYYY-MM-DD') AS date,to_char(a.start_time,'HH24:MI') AS time,a.duration_minutes,a.effort,coalesce(r.status,CASE WHEN EXISTS(SELECT 1 FROM activity_verifications v WHERE v.activity_id=a.id AND v.status='VERIFIED') THEN 'legacy_verified' ELSE 'self_reported' END) AS status,r.coach_id,r.request_note,r.review_note,r.reviewed_at,concat_ws(' ',c.first_name,c.last_name) AS coach_name`;
const FROM = `FROM activities a JOIN athlete_profiles ap ON ap.id=a.athlete_id LEFT JOIN sports s ON s.id=a.sport_id LEFT JOIN activity_types at ON at.id=a.activity_type_id LEFT JOIN activity_coach_requests r ON r.activity_id=a.id LEFT JOIN users c ON c.id=r.coach_id`;
@Injectable()
export class ActivitiesService {
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
  async findAll(userId: string) {
    await this.authorize(userId, 'ATHLETE');
    return this.db.query(
      `SELECT ${SELECT} ${FROM} WHERE ap.user_id=$1 ORDER BY a.start_time DESC NULLS LAST,a.created_at DESC`,
      [userId],
    );
  }
  async options(userId: string) {
    await this.authorize(userId, 'ATHLETE');
    return {
      kinds: TRAINING_KINDS,
      sports: await this.db.query('SELECT id,name FROM sports ORDER BY name'),
      coaches: await this.db.query(
        `SELECT c.id,concat_ws(' ',c.first_name,c.last_name) AS name,string_agg(DISTINCT t.name,', ' ORDER BY t.name) AS teams FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id JOIN coach_teams t ON t.id=m.team_id JOIN users c ON c.id=t.coach_id WHERE m.user_id=$1 AND p.status='active' AND c.role='COACH' AND c.status IS DISTINCT FROM 'SUSPENDED' GROUP BY c.id ORDER BY name`,
        [userId],
      ),
    };
  }
  async owned(tx: any, userId: string, id: string) {
    const [owned] = await tx.query(
      'SELECT a.id FROM activities a JOIN athlete_profiles ap ON ap.id=a.athlete_id WHERE a.id=$1 AND ap.user_id=$2 FOR UPDATE OF a',
      [id, userId],
    );
    if (!owned) throw new NotFoundException('Training session not found.');
    const [row] = await tx.query(
      `SELECT a.id,r.status,EXISTS(SELECT 1 FROM activity_verifications v WHERE v.activity_id=a.id AND v.status='VERIFIED') AS legacy_verified ${FROM} WHERE a.id=$1`,
      [id],
    );
    return row;
  }
  editable(row: any) {
    if (row.status === 'pending')
      throw new ConflictException(
        'Withdraw the verification request before editing or deleting this session.',
      );
    if (row.status === 'verified' || row.legacy_verified)
      throw new ConflictException(
        'Verified sessions are locked to protect the confirmed record.',
      );
  }
  async save(userId: string, body: any, id?: string) {
    const v = activityInput(body);
    await this.db.transaction(async (tx) => {
      await this.authorize(userId, 'ATHLETE', tx);
      await tx.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [userId]);
      const [sport] = await tx.query(
        'SELECT id FROM sports WHERE id::text=$1',
        [v.sport_id],
      );
      if (!sport) throw new BadRequestException('Choose an available sport.');
      let [profile] = await tx.query(
        'SELECT id FROM athlete_profiles WHERE user_id=$1 ORDER BY id LIMIT 1',
        [userId],
      );
      if (!profile)
        [profile] = await tx.query(
          "INSERT INTO athlete_profiles(user_id,profile_visibility) VALUES($1,'PRIVATE') RETURNING id",
          [userId],
        );
      const values = [
        profile.id,
        sport.id,
        v.title,
        v.description,
        v.start,
        v.duration,
        v.location,
        v.training_kind,
        v.effort,
      ];
      if (id) {
        this.editable(await this.owned(tx, userId, id));
        await tx.query(
          "UPDATE activities SET sport_id=$1,title=$2,description=$3,start_time=$4::timestamp,end_time=$4::timestamp+($5*interval '1 minute'),duration_minutes=$5,location=$6,training_kind=$7,effort=$8 WHERE id=$9",
          [...values.slice(1), id],
        );
        await tx.query(
          'DELETE FROM activity_coach_requests WHERE activity_id=$1',
          [id],
        );
      } else
        await tx.query(
          "INSERT INTO activities(athlete_id,sport_id,title,description,start_time,end_time,duration_minutes,location,training_kind,effort,created_at) VALUES($1,$2,$3,$4,$5::timestamp,$5::timestamp+($6*interval '1 minute'),$6,$7,$8,$9,now() AT TIME ZONE 'Africa/Johannesburg')",
          values,
        );
    });
    return this.findAll(userId);
  }
  async remove(userId: string, id: string) {
    await this.db.transaction(async (tx) => {
      await this.authorize(userId, 'ATHLETE', tx);
      this.editable(await this.owned(tx, userId, id));
      await tx.query('DELETE FROM activities WHERE id=$1', [id]);
    });
    return this.findAll(userId);
  }
  async request(userId: string, id: string, body: any) {
    if (
      !body ||
      Object.keys(body).some((k) => !['coach_id', 'note'].includes(k)) ||
      typeof body.coach_id !== 'string'
    )
      throw new BadRequestException('Choose a coach.');
    const message = note(body.note);
    await this.db.transaction(async (tx) => {
      await this.authorize(userId, 'ATHLETE', tx);
      const row = await this.owned(tx, userId, id);
      if (row.status === 'verified' || row.legacy_verified)
        throw new ConflictException('This session is already verified.');
      const [coach] = await tx.query(
        `SELECT c.id FROM users c WHERE c.id::text=$2 AND c.role='COACH' AND c.status IS DISTINCT FROM 'SUSPENDED' AND EXISTS(SELECT 1 FROM coach_player_accounts m JOIN coach_team_players p ON p.id=m.player_id JOIN coach_teams t ON t.id=m.team_id WHERE m.user_id=$1 AND t.coach_id=c.id AND p.status='active')`,
        [userId, body.coach_id],
      );
      if (!coach)
        throw new ForbiddenException(
          'Choose a coach linked to your active team roster.',
        );
      const [activity] = await tx.query(
        "SELECT end_time IS NOT NULL AND end_time <= now() AT TIME ZONE 'Africa/Johannesburg' AS completed FROM activities WHERE id=$1",
        [id],
      );
      if (!activity.completed)
        throw new ConflictException(
          'Add a completed session date and duration before requesting verification.',
        );
      if (row.status === 'pending') {
        const [existing] = await tx.query(
          'SELECT coach_id FROM activity_coach_requests WHERE activity_id=$1',
          [id],
        );
        if (existing.coach_id !== coach.id)
          throw new ConflictException(
            'Withdraw the existing request before choosing a different coach.',
          );
        return;
      }
      await tx.query(
        "INSERT INTO activity_coach_requests(activity_id,coach_id,status,request_note) VALUES($1,$2,'pending',$3) ON CONFLICT(activity_id) DO UPDATE SET coach_id=$2,status='pending',request_note=$3,review_note='',requested_at=now(),reviewed_at=null",
        [id, coach.id, message],
      );
    });
    return this.findAll(userId);
  }
  async withdraw(userId: string, id: string) {
    await this.db.transaction(async (tx) => {
      await this.authorize(userId, 'ATHLETE', tx);
      const row = await this.owned(tx, userId, id);
      if (row.status !== 'pending')
        throw new ConflictException('Only pending requests can be withdrawn.');
      await tx.query(
        'DELETE FROM activity_coach_requests WHERE activity_id=$1',
        [id],
      );
    });
    return this.findAll(userId);
  }
  async pending(coachId: string) {
    await this.authorize(coachId, 'COACH');
    return this.db.query(
      `SELECT ${SELECT},ap.user_id,concat_ws(' ',u.first_name,u.last_name) AS athlete_name ${FROM} JOIN users u ON u.id=ap.user_id WHERE r.coach_id=$1 AND r.status='pending' AND u.status IS DISTINCT FROM 'SUSPENDED' AND ${LINK} ORDER BY r.requested_at`,
      [coachId],
    );
  }
  async decide(coachId: string, id: string, body: any) {
    if (
      !body ||
      !['verified', 'declined'].includes(body.status) ||
      Object.keys(body).some((k) => !['status', 'note'].includes(k))
    )
      throw new BadRequestException('Approve or decline the session.');
    const message = note(body.note);
    if (body.status === 'declined' && !message)
      throw new BadRequestException('Give the athlete a reason for declining.');
    await this.db.transaction(async (tx) => {
      await this.authorize(coachId, 'COACH', tx);
      await tx.query('SELECT id FROM activities WHERE id=$1 FOR UPDATE', [id]);
      const [row] = await tx.query(
        `SELECT a.id,r.status ${FROM} JOIN users u ON u.id=ap.user_id WHERE a.id=$1 AND r.coach_id=$2 AND u.status IS DISTINCT FROM 'SUSPENDED' AND ${LINK}`,
        [id, coachId],
      );
      if (!row)
        throw new NotFoundException(
          'Verification request not found for your active roster.',
        );
      if (row.status !== 'pending')
        throw new ConflictException(
          'This request has already been reviewed or withdrawn.',
        );
      await tx.query(
        'UPDATE activity_coach_requests SET status=$2,review_note=$3,reviewed_at=now() WHERE activity_id=$1',
        [id, body.status, message],
      );
    });
    return this.pending(coachId);
  }
}
