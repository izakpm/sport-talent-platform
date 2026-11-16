import {
  Controller,
  Get,
  Header,
  Module,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SchoolsService } from './schools.service';

@Controller('schools')
@UseGuards(JwtAuthGuard)
export class SchoolsController {
  constructor(private readonly service: SchoolsService) {}
  @Get('workspace')
  @Header('Cache-Control', 'private, no-store')
  workspace(@Req() req: any) {
    return this.service.workspace(req.user.userId);
  }
}
@Module({ controllers: [SchoolsController], providers: [SchoolsService] })
export class SchoolsModule {}
