import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HubService } from './hub.service';
type Request = { user: { userId: string } };
@Controller('team-hub')
@UseGuards(JwtAuthGuard)
export class HubController {
  constructor(private readonly service: HubService) {}
  @Get('teams') teams(@Req() r: Request) {
    return this.service.teams(r.user.userId);
  }
  @Get('feed') feed(@Req() r: Request, @Query('team') team?: string) {
    return this.service.feed(r.user.userId, team);
  }
  @Post('feed') post(@Req() r: Request, @Body() b: any) {
    return this.service.post(r.user.userId, b);
  }
  @Delete('feed/:id') remove(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.removePost(r.user.userId, id);
  }
  @Get('teams/:team/links') links(
    @Req() r: Request,
    @Param('team', ParseUUIDPipe) t: string,
  ) {
    return this.service.links(r.user.userId, t);
  }
  @Post('teams/:team/players/:player/link') link(
    @Req() r: Request,
    @Param('team', ParseUUIDPipe) t: string,
    @Param('player', ParseUUIDPipe) p: string,
    @Body() b: any,
  ) {
    return this.service.link(r.user.userId, t, p, b);
  }
  @Get('calendar') @Header('Cache-Control', 'private, no-store') calendar(
    @Req() r: Request,
    @Query('month') month: string,
  ) {
    return this.service.calendar(r.user.userId, month);
  }
  @Get('sessions') sessions(@Req() r: Request) {
    return this.service.sessions(r.user.userId);
  }
  @Get('pending') pending(@Req() r: Request) {
    return this.service.pending(r.user.userId);
  }
  @Get('summary') @Header('Cache-Control', 'private, no-store') summary(
    @Req() r: Request,
  ) {
    return this.service.summary(r.user.userId);
  }
  @Get('sessions/:id') register(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.register(r.user.userId, id);
  }
  @Post('sessions/:id/players/:player') decide(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('player', ParseUUIDPipe) p: string,
    @Body() b: any,
  ) {
    return this.service.decide(r.user.userId, id, p, b);
  }
  @Post('sessions/:id/request') request(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.request(r.user.userId, id, b);
  }
  @Post('sessions/:id/code') @Header('Cache-Control', 'private, no-store') code(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.issue(r.user.userId, id);
  }
  @Delete('sessions/:id/code') close(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.closeCode(r.user.userId, id);
  }
  @Post('sessions/:id/cancel') cancel(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.cancel(r.user.userId, id, b);
  }
  @Post('check-in/preview') preview(@Req() r: Request, @Body() b: any) {
    return this.service.scan(r.user.userId, b, false);
  }
  @Post('check-in') checkin(@Req() r: Request, @Body() b: any) {
    return this.service.scan(r.user.userId, b, true);
  }
}
@Module({ controllers: [HubController], providers: [HubService] })
export class HubModule {}
