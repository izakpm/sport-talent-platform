import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AchievementVerificationService } from './achievement-verification.service';
import { AthleteProfileService } from './profile.service';
import { BadgesService } from './badges.service';
type Request = { user: { userId: string; guardianMode?: string } };
@Controller('athlete-profile')
@UseGuards(JwtAuthGuard)
export class AthleteProfileController {
  constructor(
    private readonly service: AthleteProfileService,
    private readonly verification: AchievementVerificationService,
    private readonly badges: BadgesService,
  ) {}
  @Get('badges') @Header('Cache-Control', 'private, no-store') badgeCollection(
    @Req() r: Request,
  ) {
    return this.badges.get(r.user.userId);
  }
  @Get() @Header('Cache-Control', 'private, no-store') async get(
    @Req() r: Request,
  ) {
    const profile = await this.service.get(r.user.userId);
    if (r.user.guardianMode === 'view') {
      const { id, first_name, last_name, profile_image } = profile.user;
      return { ...profile, user: { id, first_name, last_name, profile_image } };
    }
    return profile;
  }
  @Get('verification-coaches')
  @Header('Cache-Control', 'private, no-store')
  coaches(@Req() r: Request) {
    return this.verification.coaches(r.user.userId);
  }
  @Get('review-requests') @Header('Cache-Control', 'private, no-store') pending(
    @Req() r: Request,
  ) {
    return this.verification.pending(r.user.userId);
  }
  @Post('entries/:id/request') request(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.verification.request(r.user.userId, id, b);
  }
  @Delete('entries/:id/request') withdraw(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.verification.withdraw(r.user.userId, id);
  }
  @Post('entries/:id/review') review(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.verification.decide(r.user.userId, id, b);
  }
  @Patch() update(@Req() r: Request, @Body() b: any) {
    return this.service.update(r.user.userId, b);
  }
  @Put('sport') sport(@Req() r: Request, @Body() b: any) {
    return this.service.sport(r.user.userId, b);
  }
  @Post('entries') add(@Req() r: Request, @Body() b: any) {
    return this.service.saveEntry(r.user.userId, b);
  }
  @Patch('entries/:id') edit(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() b: any,
  ) {
    return this.service.saveEntry(r.user.userId, b, id);
  }
  @Delete('entries/:id') remove(
    @Req() r: Request,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.service.remove(r.user.userId, id);
  }
}
@Module({
  controllers: [AthleteProfileController],
  providers: [
    AthleteProfileService,
    AchievementVerificationService,
    BadgesService,
  ],
})
export class AthleteProfileModule {}
