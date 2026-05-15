import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AthletesService } from './athletes.service';

@Controller('athletes')
export class AthletesController {
  constructor(private readonly service: AthletesService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body.user_id);
  }

  @Get('user/:user_id')
  findByUser(@Param('user_id') user_id: string) {
    return this.service.findByUser(user_id);
  }
}