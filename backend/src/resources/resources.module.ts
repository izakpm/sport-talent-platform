import {
  Module,
  Controller,
  UseGuards,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  Query,
  ParseUUIDPipe,
  Header,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ResourcesService } from './resources.service';
type Request = { user: { userId: string } };
@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}
  @Get('capabilities') capabilities(@Req() r: Request) {
    return this.service.capabilities(r.user.userId);
  }
  @Get('admin') @Header('Cache-Control', 'private, no-store') manage(
    @Req() r: Request,
    @Query() q: any,
  ) {
    return this.service.list(r.user.userId, q, true);
  }
  @Post('admin') create(@Req() r: Request, @Body() b: any) {
    return this.service.save(r.user.userId, b);
  }
  @Get('admin/:id') @Header('Cache-Control', 'private, no-store') preview(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.detail(r.user.userId, id, true);
  }
  @Patch('admin/:id') save(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.save(r.user.userId, b, id);
  }
  @Post('admin/:id/publish') transition(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.transition(r.user.userId, id, b);
  }
  @Post('admin/:id/uploads') upload(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.upload(r.user.userId, id, b);
  }
  @Post('admin/:id/uploads/:assetId/complete') complete(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assetId', ParseUUIDPipe) asset: string,
    @Body() b: any,
  ) {
    return this.service.complete(r.user.userId, id, asset, b.version);
  }
  @Post('admin/:id/detach') detach(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.detach(r.user.userId, id, b.purpose, b.version);
  }
  @Get() @Header('Cache-Control', 'private, no-store') list(
    @Req() r: Request,
    @Query() q: any,
  ) {
    return this.service.list(r.user.userId, q);
  }
  @Get(':id') @Header('Cache-Control', 'private, no-store') detail(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.detail(r.user.userId, id);
  }
}
@Module({ controllers: [ResourcesController], providers: [ResourcesService] })
export class ResourcesModule {}
