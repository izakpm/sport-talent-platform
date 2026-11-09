import { Controller, Post, Body, Get, Param, Delete, Patch } from '@nestjs/common';
import { AthleteSportsService } from './athlete-sports.service';

@Controller('athlete-sports')
export class AthleteSportsController {
  constructor(private readonly service: AthleteSportsService) {}

  // ✅ CREATE
  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  // ✅ GET by athlete_id
  @Get(':athlete_id')
  findByAthlete(@Param('athlete_id') athlete_id: string) {
    return this.service.findByAthlete(athlete_id);
  }

  // ✅ UPDATE
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }

  // ✅ DELETE
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}