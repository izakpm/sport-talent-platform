import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityVerification } from './activity-verification.entity';
import { VerificationToken } from './verification-token.entity';
import { VerificationRequest } from './verification-request.entity'

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(ActivityVerification)
    private repo: Repository<ActivityVerification>,

    @InjectRepository(VerificationToken)
    private tokenRepo: Repository<VerificationToken>,
    
    @InjectRepository(VerificationRequest)
    private requestRepo: Repository<VerificationRequest>,

  ) {}

  verify(data: Partial<ActivityVerification>) {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  createToken() {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const token = this.tokenRepo.create({
      code,
      type: 'SESSION',
      expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    });

    return this.tokenRepo.save(token);
  }

  async verifyWithToken(activity_id: string, code: string) {
    const token = await this.tokenRepo.findOne({ where: { code } });

    if (!token) {
      throw new Error('Invalid token');
    }

    return this.repo.save({
      activity_id,
      method: 'QR_SCAN',
      verification_level: 'HIGH',
      status: 'VERIFIED',
    });
  }

  createRequest(activity_id: string, athlete_id: string, coach_id: string) {
    const request = this.requestRepo.create({
      activity_id,
      athlete_id,
      coach_id,
      status: 'PENDING',
    });

    return this.requestRepo.save(request);
  }

  async approveRequest(request_id: string) {
    const request = await this.requestRepo.findOne({
      where: { id: request_id },
    });

    if (!request) {
      throw new Error('Request not found');
    }

    request.status = 'APPROVED';
    await this.requestRepo.save(request);

    // ✅ Create verification
    return this.repo.save({
      activity_id: request.activity_id,
      method: 'COACH_APPROVAL',
      verification_level: 'HIGH',
      status: 'VERIFIED',
    });
  }
}