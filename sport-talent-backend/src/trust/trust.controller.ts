import { Controller, Get, Param } from '@nestjs/common';
import { TrustService } from './trust.service';

@Controller('trust')
export class TrustController {
  constructor(private readonly service: TrustService) {}

  @Get(':athlete_id')
  getTrustScore(@Param('athlete_id') athlete_id: string) {
    return this.service.calculateTrustScore(athlete_id);
  }
}