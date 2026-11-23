import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

export type AffiliationActor = {
  userId: string;
  actorId?: string;
  guardianMode?: string;
};
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
@Injectable()
export class AffiliationsService {
  constructor(private readonly db: DataSource) {}
  private async owner(
    actor: AffiliationActor,
    db: Pick<EntityManager, 'query'> = this.db,
    write = false,
  ) {
    const [user] = await db.query(
      `SELECT role,status FROM users WHERE id=$1${write ? ' FOR UPDATE' : ''}`,
      [actor.userId],
    );
    if (
      !user ||
      !['ATHLETE', 'COACH', 'GUARDIAN'].includes(user.role) ||
      user.status === 'SUSPENDED'
    )
      throw new ForbiddenException(
        'An active athlete, coach or parent account is required.',
      );
    if (actor.actorId) {
      const [link] = await db.query(
        `SELECT l.mode FROM guardian_links l JOIN users p ON p.id=l.guardian_id WHERE l.guardian_id=$1 AND l.child_id=$2 AND l.status='accepted' AND p.role='GUARDIAN' AND p.status IS DISTINCT FROM 'SUSPENDED'${write ? ' FOR SHARE OF l,p' : ''}`,
        [actor.actorId, actor.userId],
      );
      if (
        user.role !== 'ATHLETE' ||
        !link ||
        (write && link.mode !== 'managed')
      )
        throw new ForbiddenException(
          'Only an approved managing parent can change a child’s affiliations.',
        );
    }
    return user;
  }
  async list(actor: AffiliationActor) {
    await this.owner(actor);
    const affiliations = await this.db.query(
      `SELECT a.id,a.organisation_id,a.role,a.status,a.starts_on::text,a.ends_on::text,o.name,o.type,o.location,
      (SELECT d.logo_url FROM organisation_directory_sources d WHERE d.organisation_id=o.id AND d.logo_url IS NOT NULL ORDER BY d.source,d.external_key LIMIT 1) AS logo_url
      FROM organisation_affiliations a JOIN organisations o ON o.id=a.organisation_id WHERE a.user_id=$1 ORDER BY (a.status IN ('requested','confirmed')) DESC,a.created_at DESC`,
      [actor.userId],
    );
    return { affiliations, can_edit: actor.guardianMode !== 'view' };
  }
  async search(actor: AffiliationActor, query: unknown, type: unknown) {
    await this.owner(actor);
    if (
      typeof query !== 'string' ||
      query.trim().length < 2 ||
      query.length > 100 ||
      (type && !['SCHOOL', 'CLUB'].includes(type as string))
    )
      throw new BadRequestException(
        'Enter at least two characters and choose a school or club.',
      );
    const term = query.trim().replace(/[\\%_]/g, '\\$&');
    return this.db.query(
      `SELECT o.id,o.name,o.type,o.location,
      (SELECT d.logo_url FROM organisation_directory_sources d WHERE d.organisation_id=o.id AND d.logo_url IS NOT NULL ORDER BY d.source,d.external_key LIMIT 1) AS logo_url
      FROM organisations o WHERE upper(o.type) IN ('SCHOOL','CLUB') AND ($2::text IS NULL OR upper(o.type)=$2) AND (o.name ILIKE $1 OR o.location ILIKE $1)
      ORDER BY o.name,o.id LIMIT 30`,
      [`%${term}%`, type || null],
    );
  }
  async add(actor: AffiliationActor, body: any) {
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      Object.keys(body).some(
        (k) => !['organisation_id', 'starts_on'].includes(k),
      ) ||
      typeof body.organisation_id !== 'string' ||
      !uuid.test(body.organisation_id)
    )
      throw new BadRequestException('Choose a school or club from the list.');
    const date = body.starts_on;
    if (
      date !== undefined &&
      (typeof date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !Number.isFinite(Date.parse(date)) ||
        new Date(date).toISOString().slice(0, 10) !== date ||
        date < '1900-01-01' ||
        date >
          new Date().toLocaleDateString('en-CA', {
            timeZone: 'Africa/Johannesburg',
          }))
    )
      throw new BadRequestException(
        'Choose a valid start date that is not in the future.',
      );
    try {
      await this.db.transaction(async (tx) => {
        const user = await this.owner(actor, tx, true);
        const [org] = await tx.query(
          "SELECT id FROM organisations WHERE id=$1 AND upper(type) IN ('SCHOOL','CLUB') FOR SHARE",
          [body.organisation_id],
        );
        if (!org)
          throw new NotFoundException('This school or club is not available.');
        await tx.query(
          `INSERT INTO organisation_affiliations(user_id,organisation_id,role,requested_by_user_id,starts_on) VALUES($1,$2,$3,$4,COALESCE($5::date,(now() AT TIME ZONE 'Africa/Johannesburg')::date))`,
          [
            actor.userId,
            org.id,
            user.role,
            actor.actorId || actor.userId,
            date || null,
          ],
        );
      });
    } catch (error) {
      if ((error as any).code === '23505')
        throw new ConflictException(
          'This school or club is already on your profile.',
        );
      throw error;
    }
    return this.list(actor);
  }
  async end(actor: AffiliationActor, id: string) {
    await this.db.transaction(async (tx) => {
      await this.owner(actor, tx, true);
      const [row] = await tx.query(
        `WITH ended AS (UPDATE organisation_affiliations SET status='ended',ends_on=GREATEST(starts_on,(now() AT TIME ZONE 'Africa/Johannesburg')::date),updated_at=now() WHERE id=$1 AND user_id=$2 AND status IN ('requested','confirmed') RETURNING id) SELECT id FROM ended`,
        [id, actor.userId],
      );
      if (!row)
        throw new NotFoundException('This current affiliation was not found.');
    });
    return this.list(actor);
  }
}
