import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { ActivityVerification } from './activity-verification.entity';
import { VerificationToken } from './verification-token.entity';
import { VerificationRequest } from './verification-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityVerification, VerificationToken, VerificationRequest])],
  providers: [VerificationService],
  controllers: [VerificationController],
})
export class VerificationModule {}