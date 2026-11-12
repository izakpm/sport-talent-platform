import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes, createHash } from 'node:crypto';
import { textField, validDate } from '../coach-planning/planning.validation';
export const codeHash = (code: string) =>
  createHash('sha256').update(code.trim().toUpperCase()).digest('hex');
@Injectable()
export class GuardianService {
  constructor(private readonly db: DataSource) {}
  async authorize(id: string, role = 'GUARDIAN') {
    const [u] = await this.db.query(
      'SELECT role,status FROM users WHERE id=$1',
      [id],
    );
    if (!u || u.role !== role || u.status === 'SUSPENDED')
      throw new ForbiddenException('This account cannot access this feature.');
  }
  async children(id: string) {
    await this.authorize(id);
    return this.db.query(
      `SELECT l.id link_id,l.child_id id,l.mode,l.status,
   CASE WHEN l.status='accepted' THEN u.first_name ELSE 'Awaiting athlete approval' END first_name,
   CASE WHEN l.status='accepted' THEN u.last_name ELSE '' END last_name,
   CASE WHEN l.status='accepted' THEN u.profile_image ELSE NULL END profile_image,
   CASE WHEN l.status='accepted' AND l.mode='managed' THEN u.date_of_birth::text ELSE NULL END date_of_birth
   FROM guardian_links l JOIN users u ON u.id=l.child_id WHERE l.guardian_id=$1 AND l.status IN ('pending','accepted') AND u.status IS DISTINCT FROM 'SUSPENDED' ORDER BY l.created_at`,
      [id],
    );
  }
  async create(id: string, body: any) {
    await this.authorize(id);
    const first = textField(body?.first_name, 'First name', 80),
      last = textField(body?.last_name, 'Last name', 80);
    const dob = validDate(body?.date_of_birth);
    const today = new Date().toLocaleDateString('en-CA', {
      timeZone: 'Africa/Johannesburg',
    });
    const adult = new Date(dob + 'T12:00:00Z');
    adult.setUTCFullYear(adult.getUTCFullYear() + 18);
    if (dob > today || adult.toISOString().slice(0, 10) <= today)
      throw new BadRequestException(
        'Use Add child for someone under 18. An older athlete can approve a link to their own account.',
      );
    if (body?.guardian_confirmed !== true)
      throw new BadRequestException(
        'Confirm that you are this child’s parent or legal guardian.',
      );
    return this.db.transaction(async (tx) => {
      // A managed child has no email or usable password and cannot sign in independently.
      const [child] = await tx.query(
        `INSERT INTO users(email,password_hash,role,status,first_name,last_name,date_of_birth) VALUES(NULL,$1,'ATHLETE','ACTIVE',$2,$3,$4) RETURNING id,first_name,last_name,date_of_birth::text`,
        ['!managed:' + randomBytes(32).toString('hex'), first, last, dob],
      );
      await tx.query(
        "INSERT INTO athlete_profiles(user_id,profile_visibility) VALUES($1,'PRIVATE')",
        [child.id],
      );
      await tx.query(
        "INSERT INTO guardian_links(guardian_id,child_id,mode,status) VALUES($1,$2,'managed','accepted')",
        [id, child.id],
      );
      return child;
    });
  }
  async request(id: string, body: any) {
    await this.authorize(id);
    const email = textField(body?.email, 'Athlete email', 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new BadRequestException('Enter a valid athlete email.');
    const [athlete] = await this.db.query(
      "SELECT id FROM users WHERE lower(email)=$1 AND role='ATHLETE' AND status IS DISTINCT FROM 'SUSPENDED'",
      [email],
    );
    if (athlete)
      await this.db.query(
        `INSERT INTO guardian_links(guardian_id,child_id,mode,status) VALUES($1,$2,'view','pending') ON CONFLICT(guardian_id,child_id) DO UPDATE SET status=CASE WHEN guardian_links.status='accepted' THEN 'accepted' ELSE 'pending' END, updated_at=now() WHERE guardian_links.mode='view'`,
        [id, athlete.id],
      );
    return {
      message:
        'If that athlete account exists, a request is now available in their Connections page. They must approve it before you can view their sporting information.',
    };
  }
  async requests(id: string) {
    await this.authorize(id, 'ATHLETE');
    return this.db.query(
      `SELECT l.id,l.status,u.first_name,u.last_name,u.email FROM guardian_links l JOIN users u ON u.id=l.guardian_id WHERE l.child_id=$1 AND l.mode='view' AND l.status IN ('pending','accepted') AND u.status IS DISTINCT FROM 'SUSPENDED' ORDER BY l.created_at`,
      [id],
    );
  }
  async decide(id: string, link: string, body: any) {
    await this.authorize(id, 'ATHLETE');
    if (!['accepted', 'declined', 'revoked'].includes(body?.status))
      throw new BadRequestException(
        'Choose approve, decline or remove access.',
      );
    const rows = await this.db.query(
      `UPDATE guardian_links SET status=$3,updated_at=now() WHERE id=$1 AND child_id=$2 AND mode='view' AND status IN ('pending','accepted') RETURNING id`,
      [link, id, body.status],
    );
    if (!rows.length) throw new NotFoundException('Link request not found.');
    return { saved: true };
  }
  async remove(id: string, link: string) {
    await this.authorize(id);
    const rows = await this.db.query(
      "UPDATE guardian_links SET status='revoked',updated_at=now() WHERE id=$1 AND guardian_id=$2 AND mode='view' RETURNING id",
      [link, id],
    );
    if (!rows.length) throw new NotFoundException('Link not found.');
    return { removed: true };
  }
  async code(id: string, child: string) {
    await this.authorize(id);
    const code = 'PV-' + randomBytes(12).toString('hex').toUpperCase();
    const rows = await this.db.query(
      `UPDATE guardian_links SET coach_code_hash=$3,coach_code_expires=now()+interval '7 days' WHERE guardian_id=$1 AND child_id=$2 AND mode='managed' AND status='accepted' RETURNING coach_code_expires`,
      [id, child, codeHash(code)],
    );
    if (!rows.length) throw new NotFoundException('Managed child not found.');
    return { code, expires_at: rows[0].coach_code_expires };
  }
}
