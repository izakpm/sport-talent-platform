import {
  Body,
  Controller,
  Get,
  Header,
  Module,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TeamInvitationsService } from './team-invitations.service';
import { GuardianService } from './guardian.service';
@Controller('guardian')
@UseGuards(JwtAuthGuard)
export class GuardianController {
  constructor(
    private readonly service: GuardianService,
    private readonly invites: TeamInvitationsService,
  ) {}
  @Get('profile') @Header('Cache-Control', 'private, no-store') profile(
    @Req() r: any,
  ) {
    return this.service.profile(r.user.userId);
  }
  @Patch('profile') updateProfile(@Req() r: any, @Body() body: any) {
    return this.service.updateProfile(r.user.userId, body);
  }
  @Post('team-invites/teams/:team') createInvite(
    @Req() r: any,
    @Param('team', ParseUUIDPipe) team: string,
  ) {
    return this.invites.create(r.user.userId, team);
  }
  @Get('team-invites/teams/:team')
  @Header('Cache-Control', 'private, no-store')
  teamInvites(@Req() r: any, @Param('team', ParseUUIDPipe) team: string) {
    return this.invites.coachList(r.user.userId, team);
  }
  @Post('team-invites/teams/:team/:id') decideInvite(
    @Req() r: any,
    @Param('team', ParseUUIDPipe) team: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.invites.decide(r.user.userId, team, id, body);
  }
  @Get('team-invites')
  @Header('Cache-Control', 'private, no-store')
  parentInvites(@Req() r: any) {
    return this.invites.parentList(r.user.userId);
  }
  @Post('team-invites/preview')
  @Header('Cache-Control', 'private, no-store')
  previewInvite(@Req() r: any, @Body() body: any) {
    return this.invites.preview(r.user.userId, body?.token);
  }
  @Post('team-invites/accept') acceptInvite(@Req() r: any, @Body() body: any) {
    return this.invites.accept(r.user.userId, body);
  }
  @Post('team-invites/:id/withdraw') withdrawInvite(
    @Req() r: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.invites.withdraw(r.user.userId, id);
  }
  @Get('children') @Header('Cache-Control', 'private, no-store') children(
    @Req() r: any,
  ) {
    return this.service.children(r.user.userId);
  }
  @Post('children') create(@Req() r: any, @Body() b: any) {
    return this.service.create(r.user.userId, b);
  }
  @Post('requests') request(@Req() r: any, @Body() b: any) {
    return this.service.request(r.user.userId, b);
  }
  @Get('requests') @Header('Cache-Control', 'private, no-store') requests(
    @Req() r: any,
  ) {
    return this.service.requests(r.user.userId);
  }
  @Post('requests/:id') decide(
    @Req() r: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.decide(r.user.userId, id, b);
  }
  @Post('links/:id/remove') remove(
    @Req() r: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(r.user.userId, id);
  }
  @Post('children/:id/coach-code') code(
    @Req() r: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.code(r.user.userId, id);
  }
}
@Module({
  controllers: [GuardianController],
  providers: [GuardianService, TeamInvitationsService],
})
export class GuardianModule {}
