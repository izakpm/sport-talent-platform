import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  getActivities(@Query('athlete_id') athlete_id?: string) {
    return this.service.findAll(athlete_id);
  }

  @Post()
  createActivity(@Body() body: any) {
    const payload = { ...body };
    if (body.start_date && !body.start_time) {
      payload.start_time = new Date(body.start_date);
    }
    if (body.activity_type) {
      payload.activity_type = body.activity_type;
    }
    return this.service.create(payload);
  }
}