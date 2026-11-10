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
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';
type CoachRequest = { user: { userId: string } };
@Controller('coach-portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}
  @Get('certificate/:id') async certificate(
    @Req() req: CoachRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const file = await this.service.certificate(req.user.userId, id);
    res
      .set({
        'Content-Type': file.certificate_mime,
        'Content-Disposition': `attachment; filename="${file.certificate_name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(file.certificate_data);
  }
  @Get(':kind') list(@Req() req: CoachRequest, @Param('kind') kind: string) {
    return this.service.list(req.user.userId, kind);
  }
  @Post(':kind') create(
    @Req() req: CoachRequest,
    @Param('kind') kind: string,
    @Body() body: any,
  ) {
    return this.service.save(req.user.userId, kind, body);
  }
  @Patch(':kind/:id') edit(
    @Req() req: CoachRequest,
    @Param('kind') kind: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    return this.service.save(req.user.userId, kind, body, id);
  }
  @Delete(':id') remove(
    @Req() req: CoachRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(req.user.userId, id);
  }
}
@Module({ controllers: [PortfolioController], providers: [PortfolioService] })
export class PortfolioModule {}
