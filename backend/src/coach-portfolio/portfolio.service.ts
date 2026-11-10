import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { textField } from '../coach-planning/planning.validation';
function validDate(value: unknown) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value ||
    value < '1900-01-01' ||
    value > '2100-12-31'
  )
    throw new BadRequestException('Choose a valid date between 1900 and 2100.');
}
export const kinds = ['achievements', 'history', 'qualifications'];
export function portfolioInput(kind: string, body: any) {
  if (!kinds.includes(kind))
    throw new BadRequestException('Unknown portfolio section.');
  const title = textField(body?.title, 'Title', 160);
  const organization = textField(
    body?.organization,
    'Organisation',
    160,
    false,
  );
  const role = textField(body?.role, 'Role', 100, kind === 'history');
  const notes = textField(body?.notes, 'Details', 2000, false);
  const start = body?.start_date || null;
  const end = kind === 'achievements' ? null : body?.end_date || null;
  if (start) validDate(start);
  if (end) validDate(end);
  if (!start) throw new BadRequestException('A date is required.');
  if (end && end < start)
    throw new BadRequestException(
      'End or expiry date must be on or after the start date.',
    );
  return [title, organization, role, notes, start, end];
}
export function certificateInput(file: any) {
  if (
    !file ||
    typeof file.data !== 'string' ||
    file.data.length > 2796204 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(file.data)
  )
    throw new BadRequestException('Choose a PDF, JPG or PNG up to 2 MB.');
  const bytes = Buffer.from(file.data, 'base64');
  const mime =
    bytes.subarray(0, 5).toString() === '%PDF-'
      ? 'application/pdf'
      : bytes
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? 'image/png'
        : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
          ? 'image/jpeg'
          : '';
  if (!mime || bytes.length > 2 * 1024 * 1024 || bytes.length < 8)
    throw new BadRequestException('Choose a valid PDF, JPG or PNG up to 2 MB.');
  const name = textField(file.name, 'File name', 180).replace(
    /[^a-zA-Z0-9._ ()-]/g,
    '_',
  );
  return { bytes, mime, name };
}
const columns = `id,kind,title,organization,role,notes,to_char(start_date,'YYYY-MM-DD') AS start_date,to_char(end_date,'YYYY-MM-DD') AS end_date,certificate_name,created_at`;
@Injectable()
export class PortfolioService {
  constructor(private readonly db: DataSource) {}
  async authorize(userId: string) {
    const [user] = await this.db.query(
      'SELECT role,status FROM users WHERE id=$1',
      [userId],
    );
    if (!user || user.role !== 'COACH' || user.status === 'SUSPENDED')
      throw new ForbiddenException('A coach account is required.');
  }
  async list(userId: string, kind: string) {
    await this.authorize(userId);
    if (!kinds.includes(kind))
      throw new BadRequestException('Unknown portfolio section.');
    return this.db.query(
      `SELECT ${columns} FROM coach_portfolio WHERE coach_id=$1 AND kind=$2 ORDER BY start_date DESC,created_at DESC`,
      [userId, kind],
    );
  }
  async save(userId: string, kind: string, body: any, id?: string) {
    await this.authorize(userId);
    const fields = portfolioInput(kind, body);
    if (body.certificate && kind !== 'qualifications')
      throw new BadRequestException('Certificates belong to qualifications.');
    const file = body.certificate ? certificateInput(body.certificate) : null;
    const values = [userId, kind, ...fields];
    return this.db.transaction(async (tx) => {
      const [row] = id
        ? await tx.query(
            `WITH changed AS (UPDATE coach_portfolio SET title=$3,organization=$4,role=$5,notes=$6,start_date=$7,end_date=$8 WHERE coach_id=$1 AND kind=$2 AND id=$9 RETURNING *) SELECT ${columns} FROM changed`,
            [...values, id],
          )
        : await tx.query(
            `INSERT INTO coach_portfolio(coach_id,kind,title,organization,role,notes,start_date,end_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${columns}`,
            values,
          );
      if (!row) throw new NotFoundException('Record not found.');
      if (file || body.remove_certificate === true) {
        await tx.query(
          'UPDATE coach_portfolio SET certificate_name=$1,certificate_mime=$2,certificate_data=$3 WHERE id=$4 AND coach_id=$5',
          [
            file?.name || null,
            file?.mime || null,
            file?.bytes || null,
            row.id,
            userId,
          ],
        );
        row.certificate_name = file?.name || null;
      }
      return row;
    });
  }
  async remove(userId: string, id: string) {
    await this.authorize(userId);
    const rows = await this.db.query(
      'WITH removed AS (DELETE FROM coach_portfolio WHERE id=$1 AND coach_id=$2 RETURNING id) SELECT * FROM removed',
      [id, userId],
    );
    if (!rows.length) throw new NotFoundException('Record not found.');
    return { deleted: true };
  }
  async certificate(userId: string, id: string) {
    await this.authorize(userId);
    const [row] = await this.db.query(
      'SELECT certificate_name,certificate_mime,certificate_data FROM coach_portfolio WHERE id=$1 AND coach_id=$2 AND certificate_data IS NOT NULL',
      [id, userId],
    );
    if (!row) throw new NotFoundException('Certificate not found.');
    return row;
  }
}
