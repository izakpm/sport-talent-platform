import { DataSource } from 'typeorm';
import { guardianContext } from '../guardian/guardian-context';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { deploymentConfig } from '../deployment-config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly db: DataSource) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      passReqToCallback: true,
      secretOrKey: deploymentConfig().jwtSecret,
    });
  }

  async validate(req: any, payload: any) {
    if (
      typeof payload.sub !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(payload.sub)
    )
      throw new UnauthorizedException();
    const [user] = await this.db.query(
      'SELECT session_version,status FROM users WHERE id=$1',
      [payload.sub],
    );
    if (
      !user ||
      user.status === 'SUSPENDED' ||
      (payload.ver ?? 0) !== user.session_version
    )
      throw new UnauthorizedException('Please log in again.');
    return guardianContext(this.db, req, payload);
  }
}
