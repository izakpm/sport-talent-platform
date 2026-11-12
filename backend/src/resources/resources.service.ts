import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import {
  input,
  uploadInput,
  ready,
  topics,
  formats,
} from './resources.validation';
const bucket = 'athlete-resources';
const summaryColumns =
  'r.id,r.title,r.summary,r.topic,r.format,r.author,r.duration_minutes,r.status,r.featured,r.version,r.created_at,r.updated_at,r.published_at,r.thumbnail_id';
@Injectable()
export class ResourcesService {
  constructor(private readonly db: DataSource) {}
  private storage() {
    const url = process.env.SUPABASE_URL,
      key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key)
      throw new ServiceUnavailableException(
        'Media storage is not configured. Contact the platform administrator.',
      );
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    }).storage.from(bucket);
  }
  async access(userId: string, admin = false) {
    const [user] = await this.db.query(
      `SELECT u.role,u.status,EXISTS(SELECT 1 FROM resource_publishers p WHERE p.user_id=u.id) AS publisher FROM users u WHERE u.id=$1`,
      [userId],
    );
    if (
      !user ||
      user.status === 'SUSPENDED' ||
      (admin
        ? !user.publisher
        : !['ATHLETE', 'GUARDIAN'].includes(user.role) && !user.publisher)
    )
      throw new ForbiddenException(
        admin
          ? 'Resource publishing access is required.'
          : 'An athlete or parent account is required.',
      );
    return user;
  }
  async capabilities(userId: string) {
    const [u] = await this.db.query(
      `SELECT EXISTS(SELECT 1 FROM resource_publishers p JOIN users u ON u.id=p.user_id WHERE p.user_id=$1 AND u.status IS DISTINCT FROM 'SUSPENDED') AS can_publish`,
      [userId],
    );
    return {
      ...u,
      uploads_configured:
        !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    };
  }
  private async assetUrl(id: string | null) {
    if (!id) return null;
    const [asset] = await this.db.query(
      'SELECT path FROM resource_assets WHERE id=$1 AND uploaded',
      [id],
    );
    if (!asset) return null;
    const { data, error } = await this.storage().createSignedUrl(
      asset.path,
      14400,
    );
    if (error)
      throw new ServiceUnavailableException(
        'Unable to load media. Please try again.',
      );
    return data.signedUrl;
  }
  private async present(row: any, detail = false) {
    if (!row) return null;
    const result = {
      ...row,
      thumbnail_url: await this.assetUrl(row.thumbnail_id),
    };
    if (detail) {
      result.media_url = await this.assetUrl(row.media_id);
      result.captions_url = await this.assetUrl(row.captions_id);
      const assets = await this.db.query(
        'SELECT id,name,mime,size,purpose FROM resource_assets WHERE id=ANY($1::uuid[]) AND uploaded',
        [[row.thumbnail_id, row.media_id, row.captions_id].filter(Boolean)],
      );
      result.assets = assets;
    }
    return result;
  }
  async list(userId: string, q: any, admin = false) {
    await this.access(userId, admin);
    const search = String(q.search || '')
        .trim()
        .slice(0, 160),
      topic = topics.includes(q.topic) ? q.topic : '',
      format = formats.includes(q.format) ? q.format : '';
    const offset = Math.max(0, Math.min(100000, parseInt(q.offset) || 0));
    const status =
      admin && ['draft', 'published', 'archived'].includes(q.status)
        ? q.status
        : admin
          ? ''
          : 'published';
    const values = [status, search, topic, format];
    const where = `($1='' OR r.status=$1) AND ($2='' OR concat_ws(' ',r.title,r.summary,r.author,CASE r.topic WHEN 'mindset' THEN 'Mindset Motivation' WHEN 'nutrition' THEN 'Nutrition' WHEN 'training' THEN 'Training Skills' WHEN 'recovery' THEN 'Recovery' ELSE 'Life Beyond Sport' END) ILIKE '%'||$2||'%') AND ($3='' OR r.topic=$3) AND ($4='' OR r.format=$4)`;
    const [rows, [count], featured] = await Promise.all([
      this.db.query(
        `SELECT ${summaryColumns} FROM athlete_resources r WHERE ${where} ORDER BY r.published_at DESC NULLS LAST,r.created_at DESC,r.id LIMIT 12 OFFSET $5`,
        [...values, offset],
      ),
      this.db.query(
        `SELECT count(*)::int AS total FROM athlete_resources r WHERE ${where}`,
        values,
      ),
      !admin && !search && !topic && !format && offset === 0
        ? this.db.query(
            `SELECT ${summaryColumns} FROM athlete_resources r WHERE r.status='published' AND r.featured LIMIT 1`,
          )
        : Promise.resolve([]),
    ]);
    return {
      items: await Promise.all(rows.map((r) => this.present(r))),
      total: count.total,
      featured: await this.present(featured[0]),
      next_offset:
        offset + rows.length < count.total ? offset + rows.length : null,
    };
  }
  async detail(userId: string, id: string, admin = false) {
    await this.access(userId, admin);
    const [row] = await this.db.query(
      `SELECT * FROM athlete_resources WHERE id=$1 ${admin ? '' : "AND status='published'"}`,
      [id],
    );
    if (!row) throw new NotFoundException('Resource not found.');
    return this.present(row, true);
  }
  async save(userId: string, body: any, id?: string) {
    await this.access(userId, true);
    const fields = input(body);
    let row;
    if (id) {
      const [current] = await this.db.query(
        'SELECT r.*,a.mime FROM athlete_resources r LEFT JOIN resource_assets a ON a.id=r.media_id WHERE r.id=$1',
        [id],
      );
      if (!current) throw new NotFoundException('Resource not found.');
      if (current.status === 'archived')
        throw new BadRequestException(
          'Restore this resource to a draft before editing.',
        );
      if (current.status === 'published')
        ready({ ...current, ...fields }, current.mime);
      const keys = Object.keys(fields);
      [row] = await this.db.query(
        `UPDATE athlete_resources SET ${keys.map((k, i) => `${k}=$${i + 1}`).join(',')},updated_at=now(),version=version+1 WHERE id=$${keys.length + 1} AND version=$${keys.length + 2} RETURNING *`,
        [...Object.values(fields), id, body.version],
      );
      if (!row)
        throw new ConflictException(
          'This resource changed. Reload it before saving.',
        );
    } else {
      const keys = Object.keys(fields);
      [row] = await this.db.query(
        `INSERT INTO athlete_resources(${keys.join(',')},created_by) VALUES(${keys.map((_, i) => `$${i + 1}`).join(',')},$${keys.length + 1}) RETURNING *`,
        [...Object.values(fields), userId],
      );
    }
    return this.present(row, true);
  }
  async transition(userId: string, id: string, body: any) {
    await this.access(userId, true);
    if (
      ![
        'publish',
        'unpublish',
        'archive',
        'restore',
        'feature',
        'unfeature',
      ].includes(body.action)
    )
      throw new BadRequestException('Unknown publishing action.');
    await this.db.transaction(async (tx) => {
      await tx.query('SELECT pg_advisory_xact_lock(187452001)');
      const [row] = await tx.query(
        'SELECT r.*,a.mime FROM athlete_resources r LEFT JOIN resource_assets a ON a.id=r.media_id WHERE r.id=$1 FOR UPDATE OF r',
        [id],
      );
      if (!row) throw new NotFoundException('Resource not found.');
      if (row.version !== body.version)
        throw new ConflictException(
          'This resource changed. Reload it before continuing.',
        );
      if (body.action === 'publish' || body.action === 'feature')
        ready(row, row.mime);
      if (body.action === 'feature' && row.status !== 'published')
        throw new BadRequestException(
          'Publish this resource before featuring it.',
        );
      const status =
        body.action === 'publish'
          ? 'published'
          : body.action === 'archive'
            ? 'archived'
            : ['unpublish', 'restore'].includes(body.action)
              ? 'draft'
              : row.status;
      const featured =
        body.action === 'feature'
          ? true
          : body.action === 'unfeature' || status !== 'published'
            ? false
            : row.featured;
      if (featured)
        await tx.query(
          'UPDATE athlete_resources SET featured=false,version=version+1,updated_at=now() WHERE featured AND id<>$1',
          [id],
        );
      await tx.query(
        "UPDATE athlete_resources SET status=$2,featured=$3,published_at=CASE WHEN $2='published' AND status<>'published' THEN now() ELSE published_at END,updated_at=now(),version=version+1 WHERE id=$1",
        [id, status, featured],
      );
    });
    return this.detail(userId, id, true);
  }
  async upload(userId: string, id: string, body: any) {
    await this.access(userId, true);
    const [row] = await this.db.query(
      'SELECT format,status FROM athlete_resources WHERE id=$1',
      [id],
    );
    if (!row) throw new NotFoundException('Resource not found.');
    if (row.status !== 'draft')
      throw new BadRequestException(
        'Unpublish the resource before replacing files.',
      );
    const file = uploadInput(body, row.format),
      assetId = randomUUID(),
      path = `${id}/${assetId}`;
    const { data, error } = await this.storage().createSignedUploadUrl(path, {
      upsert: false,
    });
    if (error)
      throw new ServiceUnavailableException(
        'Unable to prepare the upload. Please try again.',
      );
    await this.db.query(
      'INSERT INTO resource_assets(id,resource_id,purpose,path,name,mime,size) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [assetId, id, file.purpose, path, file.name, file.mime, file.size],
    );
    return { id: assetId, url: data.signedUrl };
  }
  async complete(userId: string, id: string, assetId: string, version: number) {
    await this.access(userId, true);
    const [asset] = await this.db.query(
      'SELECT * FROM resource_assets WHERE id=$1 AND resource_id=$2',
      [assetId, id],
    );
    if (!asset) throw new NotFoundException('Upload not found.');
    // Storage writes its own metadata; never trust the browser's completion claim.
    const [object] = await this.db.query(
      'SELECT metadata FROM storage.objects WHERE bucket_id=$1 AND name=$2',
      [bucket, asset.path],
    );
    if (
      !object ||
      Number(object.metadata?.size) !== Number(asset.size) ||
      object.metadata?.mimetype !== asset.mime
    )
      throw new BadRequestException(
        'The upload is incomplete or does not match the selected file. Upload it again.',
      );
    await this.db.transaction(async (tx) => {
      const rows = await tx.query(
        `UPDATE athlete_resources SET ${asset.purpose}_id=$2,version=version+1,updated_at=now() WHERE id=$1 AND version=$3 AND status='draft' RETURNING id`,
        [id, assetId, version],
      );
      if (!rows.length)
        throw new ConflictException(
          'The resource changed. Reload before attaching the upload.',
        );
      await tx.query('UPDATE resource_assets SET uploaded=true WHERE id=$1', [
        assetId,
      ]);
    });
    return this.detail(userId, id, true);
  }
  async detach(userId: string, id: string, purpose: string, version: number) {
    await this.access(userId, true);
    if (!['thumbnail', 'media', 'captions'].includes(purpose))
      throw new BadRequestException('Unknown file type.');
    const rows = await this.db.query(
      `UPDATE athlete_resources SET ${purpose}_id=null,version=version+1,updated_at=now() WHERE id=$1 AND version=$2 AND status='draft' RETURNING id`,
      [id, version],
    );
    if (!rows.length)
      throw new ConflictException(
        'Unpublish or reload this resource before removing a file.',
      );
    return this.detail(userId, id, true);
  }
}
