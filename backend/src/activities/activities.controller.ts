import { Controller, Get, Post, Body } from '@nestjs/common';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}

  @Get()
  getActivities() {
    return this.service.findAll();
  }

  @Post()
  createActivity(@Body() body: any) {
    return this.service.create(body);
  }
}