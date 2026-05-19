import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { AthletesService } from './athletes.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('athletes')
export class AthletesController {
  constructor(private readonly service: AthletesService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body.user_id);
  }

  @Post('profile')
  createProfile(@Body() body: any) {
    return this.service.createProfile(body);
  }

  @Post('sports')
  addSports(@Body() body: any) {
    return this.service.addSports(body);
  }

  @Get('user/:user_id')
  findByUser(@Param('user_id') user_id: string) {
    return this.service.findByUser(user_id);
  }
}