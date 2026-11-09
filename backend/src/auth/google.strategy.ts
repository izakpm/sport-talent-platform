import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import type { Request } from 'express';
import { deploymentConfig } from '../deployment-config';

const ALLOWED_ROLES = new Set(['ATHLETE', 'COACH', 'SCHOOL']);

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      // The guard returns 503 when Google credentials are not configured.
      clientID: process.env.GOOGLE_CLIENT_ID || 'google-oauth-disabled',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'google-oauth-disabled',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        `${deploymentConfig().frontendUrl}/api/auth/google/callback`,
      scope: ['email', 'profile'],
      state: true,
      passReqToCallback: true,
    });
  }

  async validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ) {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName || '';
    const lastName = profile.name?.familyName || '';
    const sessionRole =
      typeof (req as Request & { session?: { oauthRole?: string } }).session
        ?.oauthRole === 'string'
        ? (req as Request & { session?: { oauthRole?: string } }).session
            ?.oauthRole
        : undefined;
    const role =
      sessionRole && ALLOWED_ROLES.has(sessionRole) ? sessionRole : 'ATHLETE';

    const session = (req as Request & { session?: { oauthRole?: string } })
      .session;
    if (session) {
      delete session.oauthRole;
    }

    if (!email) {
      throw new Error('Google account did not provide an email address.');
    }

    return this.authService.findOrCreateGoogleUser(
      email,
      firstName,
      lastName,
      role,
    );
  }
}
