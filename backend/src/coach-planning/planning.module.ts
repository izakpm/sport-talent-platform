import {
  Body,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlanningService } from './planning.service';

type CoachRequest = { user: { userId: string } };
@Controller('coach-planning')
@UseGuards(JwtAuthGuard)
export class PlanningController {
  constructor(private readonly service: PlanningService) {}
  @Get('teams/:teamId/players') roster(
    @Req() req: CoachRequest,
    @Param('teamId', ParseUUIDPipe) team: string,
  ) {
    return this.service.roster(req.user.userId, team);
  }
  @Post('teams/:teamId/players') addPlayer(
    @Req() req: CoachRequest,
    @Param('teamId', ParseUUIDPipe) team: string,
    @Body() body: any,
  ) {
    return this.service.savePlayer(req.user.userId, team, body);
  }
  @Patch('teams/:teamId/players/:id') editPlayer(
    @Req() req: CoachRequest,
    @Param('teamId', ParseUUIDPipe) team: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.service.savePlayer(req.user.userId, team, body, id);
  }
  @Delete('teams/:teamId/players/:id') removePlayer(
    @Req() req: CoachRequest,
    @Param('teamId', ParseUUIDPipe) team: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.removePlayer(req.user.userId, team, id);
  }
  @Get('teams') teams(@Req() req: CoachRequest) {
    return this.service.teams(req.user.userId);
  }
  @Post('teams') create(@Req() req: CoachRequest, @Body() body: any) {
    return this.service.saveTeam(req.user.userId, body);
  }
  @Patch('teams/:id') update(
    @Req() req: CoachRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.service.saveTeam(req.user.userId, body, id);
  }
  @Get('events') events(
    @Req() req: CoachRequest,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.service.events(req.user.userId, from, to);
  }
  @Post('teams/:teamId/events') add(
    @Req() req: CoachRequest,
    @Param('teamId', ParseUUIDPipe) team: string,
    @Body() body: any,
  ) {
    return this.service.saveEvents(req.user.userId, team, body);
  }
  @Patch('teams/:teamId/events/:id') edit(
    @Req() req: CoachRequest,
    @Param('teamId', ParseUUIDPipe) team: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.service.saveEvents(req.user.userId, team, body, id);
  }
  @Delete('teams/:teamId/events/:id') remove(
    @Req() req: CoachRequest,
    @Param('teamId', ParseUUIDPipe) team: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.deleteEvent(req.user.userId, team, id);
  }
}
@Module({ controllers: [PlanningController], providers: [PlanningService] })
export class PlanningModule {}
