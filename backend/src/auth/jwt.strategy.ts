import { DataSource } from 'typeorm';
import { guardianContext } from '../guardian/guardian-context';
import { Injectable } from '@nestjs/common';
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
    return guardianContext(this.db, req, payload);
  }
}
