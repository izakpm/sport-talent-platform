import {
  Body,
  Controller,
  Get,
  Header,
  Module,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoachProfileService } from './profile.service';
type Request = { user: { userId: string } };
@Controller('coach-profile')
@UseGuards(JwtAuthGuard)
export class CoachProfileController {
  constructor(private readonly service: CoachProfileService) {}
  @Get() @Header('Cache-Control', 'private, no-store') get(
    @Req() req: Request,
  ) {
    return this.service.get(req.user.userId);
  }
  @Patch() update(@Req() req: Request, @Body() body: any) {
    return this.service.update(req.user.userId, body);
  }
}
@Module({
  controllers: [CoachProfileController],
  providers: [CoachProfileService],
})
export class CoachProfileModule {}
