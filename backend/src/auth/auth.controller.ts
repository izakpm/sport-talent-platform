import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}

  @Post('login')
  login(@Body() body: any) {
    return this.service.login(body.email, body.password);
  }

  @Post('register')
  register(@Body() body: any) {
    return this.service.register(body);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Initiates Google OAuth2 login flow.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: ExpressRequest & { user?: any },
    @Res() res: Response,
  ) {
    const result = await this.service.loginWithUser(req.user as any);
    const redirectUrl = `http://localhost:3000/login?token=${encodeURIComponent(
      result.access_token,
    )}`;
    return res.redirect(redirectUrl);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: ExpressRequest & { user?: any }) {
    return req.user;
  }
}