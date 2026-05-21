import { Controller, Get, Query } from '@nestjs/common';
import { DiscoveryService } from './discovery.service';

@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly service: DiscoveryService) {}

  @Get('athletes')
  searchAthletes(
    @Query('sport_id') sport_id?: string,
    @Query('position_id') position_id?: string,
    @Query('query') query?: string,
    @Query('public_only') public_only?: string,
  ) {
    return this.service.searchAthletes({
      sport_id,
      position_id,
      query,
      public_only: public_only === 'true',
    });
  }

  @Get('coaches')
  searchCoaches(@Query('query') query?: string) {
    return this.service.searchCoaches({ query });
  }
}
