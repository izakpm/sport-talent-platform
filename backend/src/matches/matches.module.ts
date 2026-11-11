import {
  Body,
  Controller,
  Get,
  Header,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HubService } from '../team-hub/hub.service';
import { MatchesService } from './matches.service';
@Controller('team-hub/matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private readonly service: MatchesService) {}
  @Get() @Header('Cache-Control', 'private, no-store') list(@Req() r: any) {
    return this.service.list(r.user.userId);
  }
  @Post(':id/result') result(
    @Req() r: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.save(r.user.userId, id, b);
  }
  @Post(':id/stats') stats(
    @Req() r: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.save(r.user.userId, id, b, true);
  }
}
@Module({
  controllers: [MatchesController],
  providers: [MatchesService, HubService],
})
export class MatchesModule {}
