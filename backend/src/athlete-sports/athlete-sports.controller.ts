import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AthleteSportsService } from './athlete-sports.service';

@Controller('athlete-sports')
export class AthleteSportsController {
  constructor(private readonly service: AthleteSportsService) {}

  // ✅ CREATE (already exists)
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  // ✅ NEW: GET by athlete_id
  @Get(':athlete_id')
  findByAthlete(@Param('athlete_id') athlete_id: string) {
    return this.service.findByAthlete(athlete_id);
  }
}