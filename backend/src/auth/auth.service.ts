import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    if (
      typeof email !== 'string' ||
      !email.trim() ||
      typeof password !== 'string' ||
      !password
    )
      throw new UnauthorizedException('Invalid credentials');
    const user = await this.usersService.findByEmail(
      email.trim().toLowerCase(),
    );

    if (
      !user ||
      user.status === 'SUSPENDED' ||
      user.password_login_enabled === false ||
      !user.email
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    let isMatch = false;

    if (user.password_hash?.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy plain-text password stored in the database.
      isMatch = password === user.password_hash;
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usersService.update(user.id, {
          password_hash: hashedPassword,
        });
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.password_login_enabled !== true) {
      await this.usersService.update(user.id, { password_login_enabled: true });
      user.password_login_enabled = true;
    }
    return this.signUser(user);
  }

  async register(data: any) {
    if (
      !data ||
      typeof data.email !== 'string' ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      typeof data.password !== 'string' ||
      data.password.length < 6 ||
      !['ATHLETE', 'COACH', 'GUARDIAN', 'SCHOOL', 'ORG'].includes(data.role)
    )
      throw new BadRequestException(
        'Enter a valid email, a password of at least six characters and an available account type.',
      );
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      email: data.email.trim().toLowerCase(),
      password_hash: hashedPassword,
      password_login_enabled: true,
      role: data.role === 'ORG' ? 'SCHOOL' : data.role,
      first_name: data.first_name,
      last_name: data.last_name,
    });
    const { password_hash, google_subject, session_version, ...publicUser } =
      user;
    return publicUser;
  }

  async findOrCreateGoogleUser(
    email: string,
    firstName: string,
    lastName: string,
    role: string,
    googleSubject?: string,
  ) {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      const randomPassword = randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.usersService.create({
        email,
        password_hash: hashedPassword,
        password_login_enabled: false,
        google_subject: googleSubject || null,
        role: role === 'ORG' ? 'SCHOOL' : role || 'ATHLETE',
        first_name: firstName,
        last_name: lastName,
      });
    }

    if (user.status === 'SUSPENDED')
      throw new UnauthorizedException('Account unavailable.');
    if (googleSubject) {
      if (user.google_subject && user.google_subject !== googleSubject)
        throw new UnauthorizedException('Google account mismatch.');
      if (!user.google_subject) {
        await this.usersService.update(user.id, {
          google_subject: googleSubject,
        });
        user.google_subject = googleSubject;
      }
    }
    return user;
  }

  async loginWithUser(user: any) {
    return this.signUser(user);
  }

  private signUser(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      ver: user.session_version || 0,
    };
    const { password_hash, google_subject, session_version, ...publicUser } =
      user;

    return {
      access_token: this.jwtService.sign(payload),
      user: publicUser,
    };
  }
}
