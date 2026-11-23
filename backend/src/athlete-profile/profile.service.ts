import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { detailsInput, entryInput, METRICS } from './profile.validation';
@Injectable()
export class AthleteProfileService {
  constructor(private readonly db: DataSource) {}
  async owner(id: string, tx: any = this.db, lock = false) {
    const [user] = await tx.query(
      `SELECT id,first_name,last_name,email,phone,profile_image,role,status FROM users WHERE id=$1${lock ? ' FOR UPDATE' : ''}`,
      [id],
    );
    if (!user || user.role !== 'ATHLETE' || user.status === 'SUSPENDED')
      throw new ForbiddenException('An active athlete account is required.');
    return user;
  }
  async get(id: string) {
    const user = await this.owner(id);
    const [details] = await this.db.query(
      'SELECT id,nationality,province,bio FROM athlete_profiles WHERE user_id=$1 ORDER BY id LIMIT 1',
      [id],
    );
    const sports = details
      ? await this.db.query(
          'SELECT a.*,s.name AS sport_name,p.name AS position_name FROM athlete_sports a JOIN sports s ON s.id=a.sport_id LEFT JOIN positions p ON p.id=a.position_id WHERE a.athlete_id=$1 ORDER BY s.name,a.primary_position DESC,p.name',
          [details.id],
        )
      : [];
    const entries = await this.db.query(
      `SELECT e.id,e.kind,e.title,e.date::text,e.organization,e.notes,e.value::float,e.unit,e.achievement_type,e.selection_level,e.leadership_role,e.leadership_date::text,e.organisation_id,o.name AS organisation_name,
        (SELECT d.logo_url FROM organisation_directory_sources d WHERE d.organisation_id=e.organisation_id AND d.logo_url IS NOT NULL ORDER BY (d.source='playverified-network') DESC,d.source,d.external_key LIMIT 1) AS organisation_logo_url,COALESCE(r.status,'self_reported') AS verification_status,r.coach_id AS verification_coach_id,r.review_note,r.reviewed_at,concat_ws(' ',c.first_name,c.last_name) AS verification_coach_name
        FROM athlete_portfolio_entries e LEFT JOIN organisations o ON o.id=e.organisation_id LEFT JOIN achievement_coach_requests r ON r.entry_id=e.id LEFT JOIN users c ON c.id=r.coach_id WHERE e.user_id=$1 ORDER BY e.date DESC,e.created_at DESC`,
      [id],
    );
    return {
      user,
      details: details || {},
      sports,
      entries,
      catalog: {
        sports: await this.db.query('SELECT id,name FROM sports ORDER BY name'),
        positions: await this.db.query(
          'SELECT id,name,sport_id FROM positions ORDER BY name',
        ),
        metrics: METRICS,
      },
    };
  }
  async profile(tx: any, id: string) {
    const [p] = await tx.query(
      'SELECT id FROM athlete_profiles WHERE user_id=$1 ORDER BY id LIMIT 1',
      [id],
    );
    if (p) return p;
    const [created] = await tx.query(
      "INSERT INTO athlete_profiles(user_id,profile_visibility) VALUES($1,'PRIVATE') RETURNING id",
      [id],
    );
    return created;
  }
  async update(id: string, body: any) {
    const fields = detailsInput(body);
    await this.db.transaction(async (tx) => {
      await this.owner(id, tx, true);
      const profile = await this.profile(tx, id);
      for (const [key, value] of Object.entries(fields)) {
        const account = [
          'first_name',
          'last_name',
          'phone',
          'profile_image',
        ].includes(key);
        await tx.query(
          `UPDATE ${account ? 'users' : 'athlete_profiles'} SET ${key}=$2 WHERE id=$1`,
          [account ? id : profile.id, value],
        );
      }
    });
    return this.get(id);
  }
  async sport(id: string, body: any) {
    if (
      !body ||
      Object.keys(body).some(
        (k) =>
          ![
            'sport_id',
            'position_ids',
            'primary_position_id',
            'is_primary',
          ].includes(k),
      ) ||
      typeof body.sport_id !== 'string' ||
      !Array.isArray(body.position_ids) ||
      body.position_ids.length > 30 ||
      body.position_ids.some((v: any) => typeof v !== 'string') ||
      typeof body.is_primary !== 'boolean'
    )
      throw new BadRequestException('Select a sport and positions.');
    const ids = [...new Set<string>(body.position_ids)];
    if (ids.length && !ids.includes(body.primary_position_id))
      throw new BadRequestException('Choose your primary position.');
    await this.db.transaction(async (tx) => {
      await this.owner(id, tx, true);
      const [sport] = await tx.query(
        'SELECT id FROM sports WHERE id::text=$1',
        [body.sport_id],
      );
      if (!sport) throw new BadRequestException('Choose an available sport.');
      const positions = await tx.query(
        'SELECT id FROM positions WHERE sport_id=$1 AND id::text=ANY($2::text[])',
        [sport.id, ids],
      );
      if (positions.length !== ids.length)
        throw new BadRequestException('Choose positions for this sport.');
      const p = await this.profile(tx, id);
      if (body.is_primary && ids.length)
        await tx.query(
          'UPDATE athlete_sports SET is_primary=false WHERE athlete_id=$1',
          [p.id],
        );
      await tx.query(
        'DELETE FROM athlete_sports WHERE athlete_id=$1 AND sport_id=$2',
        [p.id, sport.id],
      );
      for (const pos of ids)
        await tx.query(
          'INSERT INTO athlete_sports(athlete_id,sport_id,position_id,is_primary,primary_position) VALUES($1,$2,$3,$4,$5)',
          [
            p.id,
            sport.id,
            pos,
            body.is_primary && pos === body.primary_position_id,
            pos === body.primary_position_id,
          ],
        );
    });
    return this.get(id);
  }
  async saveEntry(id: string, body: any, entryId?: string) {
    entryInput(body);
    await this.db.transaction(async (tx) => {
      await this.owner(id, tx, true);
      let input = body;
      if (entryId) {
        const [existing] = await tx.query(
          'SELECT achievement_type,selection_level,leadership_role,leadership_date::text,organisation_id FROM athlete_portfolio_entries WHERE user_id=$1 AND id=$2 FOR UPDATE',
          [id, entryId],
        );
        if (!existing) throw new NotFoundException('Record not found.');
        await this.editable(tx, entryId);
        // Older clients may omit the new fields; preserve them on ordinary edits.
        input = { ...existing, ...body };
      }
      const e = entryInput(input);
      if (e.organisation_id) {
        const [org] = await tx.query(
          "SELECT name FROM organisations WHERE id=$1 AND upper(type) IN ('SCHOOL','CLUB') FOR SHARE",
          [e.organisation_id],
        );
        if (!org)
          throw new BadRequestException('Choose an available school or club.');
        e.organization = org.name;
      }
      const values = [
        id,
        e.kind,
        e.title,
        e.date,
        e.organization,
        e.notes,
        e.value,
        e.unit,
        e.achievement_type,
        e.leadership_role,
        e.leadership_date,
        e.organisation_id,
        e.selection_level,
      ];
      if (entryId) {
        const rows = await tx.query(
          'UPDATE athlete_portfolio_entries SET kind=$2,title=$3,date=$4,organization=$5,notes=$6,value=$7,unit=$8,achievement_type=$9,leadership_role=$10,leadership_date=$11,organisation_id=$12,selection_level=$13 WHERE user_id=$1 AND id=$14 RETURNING id',
          [...values, entryId],
        );
        if (!rows.length) throw new NotFoundException('Record not found.');
        await tx.query(
          "DELETE FROM achievement_coach_requests WHERE entry_id=$1 AND status='declined'",
          [entryId],
        );
      } else
        await tx.query(
          'INSERT INTO athlete_portfolio_entries(user_id,kind,title,date,organization,notes,value,unit,achievement_type,leadership_role,leadership_date,organisation_id,selection_level) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
          values,
        );
    });
    return this.get(id);
  }
  async editable(tx: any, entryId: string) {
    const [request] = await tx.query(
      'SELECT status FROM achievement_coach_requests WHERE entry_id=$1',
      [entryId],
    );
    if (request?.status === 'pending')
      throw new ConflictException(
        'Withdraw the verification request before editing or removing this achievement.',
      );
    if (request?.status === 'verified')
      throw new ConflictException(
        'Verified achievements are locked to protect the confirmed record.',
      );
  }
  async remove(id: string, entryId: string) {
    await this.db.transaction(async (tx) => {
      await this.owner(id, tx, true);
      const [entry] = await tx.query(
        'SELECT id FROM athlete_portfolio_entries WHERE user_id=$1 AND id=$2 FOR UPDATE',
        [id, entryId],
      );
      if (!entry) throw new NotFoundException('Record not found.');
      await this.editable(tx, entryId);
      await tx.query(
        'DELETE FROM athlete_portfolio_entries WHERE user_id=$1 AND id=$2',
        [id, entryId],
      );
    });
    return this.get(id);
  }
}
