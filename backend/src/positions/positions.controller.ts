import { Controller, Get, Param } from '@nestjs/common';
import { PositionsService } from './positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly service: PositionsService) {}

  // ✅ GET ALL POSITIONS
  @Get()
  findAll() {
    return this.service.findAll();
  }

  // ✅ GET BY SPORT
  @Get(':sport_id')
  findBySport(@Param('sport_id') sport_id: string) {
    return this.service.findBySport(sport_id);
  }
}