import { Controller, Post, Body } from '@nestjs/common';
import { VerificationService } from './verification.service';

@Controller('verification')
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Post('verify')
  verifyActivity(@Body() body: any) {
    return this.service.verify({
      activity_id: body.activity_id,
      method: body.method || 'QR_SCAN',
      verification_level: 'HIGH',
      status: 'VERIFIED',
    });
  }

  @Post('token')
  createToken() {
    return this.service.createToken();
  }

  @Post('scan')
  scan(@Body() body: any) {
    return this.service.verifyWithToken(body.activity_id, body.code);
  }

  @Post('request')
  requestVerification(@Body() body: any) {
    return this.service.createRequest(
      body.activity_id,
      body.athlete_id,
      body.coach_id,
    );
  }

  @Post('approve')
  approve(@Body() body: any) {
    return this.service.approveRequest(body.request_id);
  }
}