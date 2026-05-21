import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { AuthService } from './auth.service';
import type { Request } from 'express';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        'http://localhost:3000/auth/google/callback',
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
    const role = (req.query.state as string) || 'ATHLETE';

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
