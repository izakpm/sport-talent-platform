import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { deploymentConfig } from '../deployment-config';
import { SecurityEmailService } from './security-email.service';

const hash = (value: string) =>
  createHash('sha256').update(value).digest('hex');
const generic = {
  message:
    'If this email has an eligible account, you will receive instructions shortly. Check your spam folder too.',
};
const invalidLink = () =>
  new BadRequestException(
    'This reset link is invalid or has expired. Request a new link.',
  );
export function validateNewPassword(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length < 12 ||
    Buffer.byteLength(value, 'utf8') > 72
  )
    throw new BadRequestException(
      'Use at least 12 characters and no more than 72 bytes for your new password.',
    );
}

@Injectable()
export class AccountSecurityService {
  private readonly logger = new Logger(AccountSecurityService.name);
  constructor(
    private readonly db: DataSource,
    private readonly mail: SecurityEmailService,
  ) {}

  private managed(user: any) {
    return !user.email || user.password_hash?.startsWith('!managed:');
  }
  private async user(id: string) {
    const [user] = await this.db.query('SELECT * FROM users WHERE id=$1', [id]);
    if (!user) throw new NotFoundException('Account not found.');
    return user;
  }
  async capabilities(id: string) {
    const user = await this.user(id);
    return {
      email: user.email,
      managed: this.managed(user),
      google: !!user.google_subject,
      password:
        user.password_login_enabled === true
          ? 'enabled'
          : user.password_login_enabled === false
            ? 'disabled'
            : 'unknown',
    };
  }
  // Database-backed limits work across serverless instances. Keys contain no email/IP.
  private async allowed(key: string, limit: number) {
    const [row] = await this.db.query(
      `INSERT INTO auth_rate_limits(bucket,attempts,expires_at)
      VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(bucket) DO UPDATE SET
      attempts=CASE WHEN auth_rate_limits.expires_at<=now() THEN 1 ELSE auth_rate_limits.attempts+1 END,
      expires_at=CASE WHEN auth_rate_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE auth_rate_limits.expires_at END
      RETURNING attempts`,
      [hash(key)],
    );
    return row.attempts <= limit;
  }
  async forgot(email: unknown, ip: string) {
    this.mail.assertConfigured();
    if (!(await this.allowed(`forgot-ip:${ip}`, 20))) return generic;
    if (typeof email !== 'string' || email.length > 254) return generic;
    const normalized = email.trim().toLowerCase();
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ||
      !(await this.allowed(`forgot-email:${normalized}`, 3))
    )
      return generic;
    const [user] = await this.db.query(
      'SELECT * FROM users WHERE lower(email)=$1',
      [normalized],
    );
    if (!user || this.managed(user) || user.status === 'SUSPENDED')
      return generic;
    const token = randomBytes(32).toString('hex');
    const googleOnly = user.password_login_enabled === false;
    if (!googleOnly) {
      await this.db.transaction(async (tx) => {
        await tx.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [
          user.id,
        ]);
        await tx.query('DELETE FROM password_reset_tokens WHERE user_id=$1', [
          user.id,
        ]);
        await tx.query(
          `INSERT INTO password_reset_tokens(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '30 minutes')`,
          [hash(token), user.id],
        );
      });
    }
    try {
      await this.mail.send(
        user.email,
        googleOnly
          ? undefined
          : `${deploymentConfig().frontendUrl}/reset-password#token=${token}`,
      );
    } catch {
      await this.db.query(
        'DELETE FROM password_reset_tokens WHERE token_hash=$1',
        [hash(token)],
      );
      this.logger.error(
        'Password recovery email delivery failed. Check the email service configuration.',
      );
    }
    return generic;
  }
  async change(id: string, current: unknown, password: unknown) {
    validateNewPassword(password);
    if (!(await this.allowed(`change:${id}`, 5)))
      throw new HttpException(
        'Too many attempts. Try again in 15 minutes.',
        429,
      );
    if (typeof current !== 'string' || Buffer.byteLength(current, 'utf8') > 256)
      throw new BadRequestException('Enter your current password.');
    await this.db.transaction(async (tx) => {
      const [user] = await tx.query(
        'SELECT * FROM users WHERE id=$1 FOR UPDATE',
        [id],
      );
      if (!user || this.managed(user) || user.password_login_enabled === false)
        throw new ForbiddenException(
          'This account does not use a PlayVerified password.',
        );
      const matches = user.password_hash.startsWith('$2')
        ? await bcrypt.compare(current, user.password_hash)
        : current === user.password_hash;
      if (!matches)
        throw new BadRequestException('Your current password is incorrect.');
      if (current === password)
        throw new BadRequestException('Choose a different new password.');
      await this.savePassword(tx, id, password);
    });
    return { message: 'Password changed. Please log in again.' };
  }
  private async savePassword(tx: EntityManager, id: string, password: string) {
    await tx.query(
      'UPDATE users SET password_hash=$2,password_login_enabled=true,session_version=session_version+1 WHERE id=$1',
      [id, await bcrypt.hash(password, 12)],
    );
    await tx.query('DELETE FROM password_reset_tokens WHERE user_id=$1', [id]);
  }
  async reset(token: unknown, password: unknown, ip: string) {
    if (!(await this.allowed(`reset-ip:${ip}`, 20)))
      throw new HttpException(
        'Too many attempts. Try again in 15 minutes.',
        429,
      );
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
      throw invalidLink();
    validateNewPassword(password);
    const digest = hash(token);
    const [candidate] = await this.db.query(
      'SELECT user_id FROM password_reset_tokens WHERE token_hash=$1',
      [digest],
    );
    if (!candidate) throw invalidLink();
    await this.db.transaction(async (tx) => {
      // Same lock order as change/forgot, then recheck token after locking.
      const [user] = await tx.query(
        'SELECT * FROM users WHERE id=$1 FOR UPDATE',
        [candidate.user_id],
      );
      const [valid] = await tx.query(
        'SELECT token_hash FROM password_reset_tokens WHERE token_hash=$1 AND expires_at>now() AND used_at IS NULL',
        [digest],
      );
      if (
        !valid ||
        !user ||
        this.managed(user) ||
        user.password_login_enabled === false ||
        user.status === 'SUSPENDED'
      )
        throw invalidLink();
      await this.savePassword(tx, user.id, password);
    });
    return {
      message: 'Password reset. You can now log in with your new password.',
    };
  }
}
