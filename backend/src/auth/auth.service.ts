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

    if (!user || user.password_hash !== password) {
      throw new Error('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
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
}