import { Controller, Get } from '@nestjs/common';
import { SportsService } from './sports.service';

@Controller('sports')
export class SportsController {
  constructor(private readonly service: SportsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}