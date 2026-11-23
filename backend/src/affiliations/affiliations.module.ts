import {
  Body,
  Controller,
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
import { AffiliationsService } from './affiliations.service';
@Controller('affiliations')
@UseGuards(JwtAuthGuard)
export class AffiliationsController {
  constructor(private readonly service: AffiliationsService) {}
  @Get() @Header('Cache-Control', 'private, no-store') list(@Req() req: any) {
    return this.service.list(req.user);
  }
  @Get('organisations') @Header('Cache-Control', 'private, no-store') search(
    @Req() req: any,
    @Query('q') q: string,
    @Query('type') type: string,
  ) {
    return this.service.search(req.user, q, type);
  }
  @Post() add(@Req() req: any, @Body() body: any) {
    return this.service.add(req.user, body);
  }
  @Post(':id/end') end(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.end(req.user, id);
  }
}
@Module({
  controllers: [AffiliationsController],
  providers: [AffiliationsService],
})
export class AffiliationsModule {}
