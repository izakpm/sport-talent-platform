import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { profileInput } from './profile.validation';
@Injectable()
export class CoachProfileService {
  constructor(private readonly db: DataSource) {}
  async get(userId: string) {
    const [user] = await this.db.query(
      'SELECT id,first_name,last_name,email,phone,profile_image,role,status FROM users WHERE id=$1',
      [userId],
    );
    if (!user || user.role !== 'COACH' || user.status === 'SUSPENDED')
      throw new ForbiddenException('An active coach account is required.');
    const [details] = await this.db.query(
      'SELECT headline,primary_sport,location,years_experience,specialisms,bio FROM coach_profiles WHERE user_id=$1',
      [userId],
    );
    const [counts] = await this.db.query(
      `SELECT (SELECT count(*)::int FROM coach_teams WHERE coach_id=$1) AS teams,(SELECT count(*)::int FROM coach_portfolio WHERE coach_id=$1 AND kind='achievements') AS achievements,(SELECT count(*)::int FROM coach_portfolio WHERE coach_id=$1 AND kind='history') AS history,(SELECT count(*)::int FROM coach_portfolio WHERE coach_id=$1 AND kind='qualifications') AS qualifications`,
      [userId],
    );
    return { user, details: details || {}, counts };
  }
  async update(userId: string, body: any) {
    const data = profileInput(body);
    await this.db.transaction(async (tx) => {
      const [user] = await tx.query(
        'SELECT role,status FROM users WHERE id=$1 FOR UPDATE',
        [userId],
      );
      if (!user || user.role !== 'COACH' || user.status === 'SUSPENDED')
        throw new ForbiddenException('An active coach account is required.');
      const accountFields = [
        'first_name',
        'last_name',
        'phone',
        'profile_image',
      ];
      const account = Object.entries(data).filter(([key]) =>
        accountFields.includes(key),
      );
      const details = Object.entries(data).filter(
        ([key]) => !accountFields.includes(key),
      );
      if (account.length)
        await tx.query(
          `UPDATE users SET ${account.map(([key], i) => `${key}=$${i + 2}`).join(',')} WHERE id=$1`,
          [userId, ...account.map(([, value]) => value)],
        );
      if (details.length) {
        await tx.query(
          'INSERT INTO coach_profiles(user_id) VALUES($1) ON CONFLICT(user_id) DO NOTHING',
          [userId],
        );
        await tx.query(
          `UPDATE coach_profiles SET ${details.map(([key], i) => `${key}=$${i + 2}`).join(',')} WHERE user_id=$1`,
          [userId, ...details.map(([, value]) => value)],
        );
      }
    });
    return this.get(userId);
  }
}
