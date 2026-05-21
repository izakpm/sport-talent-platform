import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    let isMatch = false;

    if (user.password_hash?.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, user.password_hash);
    } else {
      // Legacy plain-text password stored in the database.
      isMatch = password === user.password_hash;
      if (isMatch) {
        const hashedPassword = await bcrypt.hash(password, 10);
        await this.usersService.update(user.id, { password_hash: hashedPassword });
      }
    }

    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    return this.signUser(user);
  }

  async register(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.usersService.create({
      email: data.email,
      password_hash: hashedPassword,
      role: data.role,
      first_name: data.first_name,
      last_name: data.last_name,
    });
  }

  async findOrCreateGoogleUser(
    email: string,
    firstName: string,
    lastName: string,
    role: string,
  ) {
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(2);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await this.usersService.create({
        email,
        password_hash: hashedPassword,
        role: role || 'ATHLETE',
        first_name: firstName,
        last_name: lastName,
      });
    }

    return user;
  }

  async loginWithUser(user: any) {
    return this.signUser(user);
  }

  private signUser(user: any) {
    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}