import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class TrustService {
  constructor(private dataSource: DataSource) {}

  async calculateTrustScore(athlete_id: string) {
    // ✅ Get total activities
    const totalActivities = await this.dataSource.query(
      `SELECT COUNT(*) FROM activities WHERE athlete_id = $1`,
      [athlete_id],
    );

    // ✅ Get verified activities
    const verifiedActivities = await this.dataSource.query(
      `
      SELECT COUNT(DISTINCT v.activity_id)
      FROM activity_verifications v
      JOIN activities a ON a.id = v.activity_id
      WHERE a.athlete_id = $1
      `,
      [athlete_id],
    );

    // ✅ Count QR verifications
    const qrCount = await this.dataSource.query(
      `
      SELECT COUNT(DISTINCT v.activity_id)
      FROM activity_verifications v
      JOIN activities a ON a.id = v.activity_id
      WHERE a.athlete_id = $1
      AND v.method = 'QR_SCAN'
      `,
      [athlete_id],
    );

    // ✅ Count Coach verifications
    const coachCount = await this.dataSource.query(
      `
      SELECT COUNT(DISTINCT v.activity_id)
      FROM activity_verifications v
      JOIN activities a ON a.id = v.activity_id
      WHERE a.athlete_id = $1
      AND v.method = 'COACH_APPROVAL'
      `,
      [athlete_id],
    );

    // Extract values
    const total = parseInt(totalActivities[0].count) || 0;
    const verified = parseInt(verifiedActivities[0].count) || 0;
    const qr = parseInt(qrCount[0].count) || 0;
    const coach = parseInt(coachCount[0].count) || 0;

    // ✅ Base score
    let score = total > 0 ? (verified / total) * 100 : 0;

    // ✅ Add bonuses
    score += qr * 10;
    score += coach * 5;

    // ✅ Cap score
    if (score > 100) score = 100;

    return {
      athlete_id,
      score: Math.round(score),
      breakdown: {
        total_activities: total,
        verified_activities: verified,
        qr_verifications: qr,
        coach_verifications: coach,
      },
    };
  }
}