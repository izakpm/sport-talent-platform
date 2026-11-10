import {
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  canActivate(context: ExecutionContext) {
    context.switchToHttp().getResponse().setHeader('Cache-Control', 'no-store');
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ServiceUnavailableException(
        'Google sign-in is not configured. Use email and password.',
      );
    }
    const req = context.switchToHttp().getRequest<
      Request & {
        query?: Record<string, unknown>;
        session?: { oauthRole?: string };
      }
    >();

    const requestedRole = req.query?.role;
    if (
      typeof requestedRole === 'string' &&
      ['ATHLETE', 'COACH', 'SCHOOL', 'GUARDIAN', 'ORG'].includes(
        requestedRole,
      ) &&
      req.session
    ) {
      req.session.oauthRole =
        requestedRole === 'ORG' ? 'SCHOOL' : requestedRole;
    }

    return super.canActivate(context);
  }
}
