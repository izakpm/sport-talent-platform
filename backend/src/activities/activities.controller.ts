import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ActivitiesService } from './activities.service';
type Request = { user: { userId: string } };
@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly service: ActivitiesService) {}
  @Get() @Header('Cache-Control', 'private, no-store') list(@Req() r: Request) {
    return this.service.findAll(r.user.userId);
  }
  @Get('options') options(@Req() r: Request) {
    return this.service.options(r.user.userId);
  }
  @Get('review-requests') @Header('Cache-Control', 'private, no-store') pending(
    @Req() r: Request,
  ) {
    return this.service.pending(r.user.userId);
  }
  @Post() create(@Req() r: Request, @Body() b: any) {
    return this.service.save(r.user.userId, b);
  }
  @Put(':id') update(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.save(r.user.userId, b, id);
  }
  @Delete(':id') remove(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(r.user.userId, id);
  }
  @Post(':id/request') request(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.request(r.user.userId, id, b);
  }
  @Delete(':id/request') withdraw(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.withdraw(r.user.userId, id);
  }
  @Post(':id/review') decide(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.decide(r.user.userId, id, b);
  }
}
