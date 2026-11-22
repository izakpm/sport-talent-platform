import {
  Body,
  Controller,
  Get,
  Header,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AccountSecurityService } from './account-security.service';

@Controller('auth')
export class AccountSecurityController {
  constructor(private readonly security: AccountSecurityService) {}
  @Get('security')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  details(@Req() req: any) {
    return this.security.capabilities(req.user.userId);
  }
  @Post('change-password')
  @Header('Cache-Control', 'no-store')
  @UseGuards(JwtAuthGuard)
  change(@Req() req: any, @Body() body: any) {
    return this.security.change(
      req.user.userId,
      body?.currentPassword,
      body?.newPassword,
    );
  }
  @Post('forgot-password')
  @Header('Cache-Control', 'no-store')
  forgot(@Req() req: any, @Body() body: any) {
    return this.security.forgot(
      body?.email,
      req.ip || req.socket?.remoteAddress || 'unknown',
    );
  }
  @Post('reset-password')
  @Header('Cache-Control', 'no-store')
  reset(@Req() req: any, @Body() body: any) {
    return this.security.reset(
      body?.token,
      body?.newPassword,
      req.ip || req.socket?.remoteAddress || 'unknown',
    );
  }
}
