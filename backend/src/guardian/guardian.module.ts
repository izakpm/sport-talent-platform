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
import { GuardianService } from './guardian.service';
@Controller('guardian')
@UseGuards(JwtAuthGuard)
export class GuardianController {
  constructor(private readonly service: GuardianService) {}
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
@Module({ controllers: [GuardianController], providers: [GuardianService] })
export class GuardianModule {}
