import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { AthletesService } from '../athletes/athletes.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
    private athletesService: AthletesService,
  ) {}

  
  async create(data: Partial<User>) {
    // ✅ Create user
    const user = this.repo.create(data);
    const savedUser = await this.repo.save(user);

    return savedUser;
  }

  async update(id: string, data: any) {
    await this.repo.update({ id }, data);
    return this.repo.findOne({ where: { id } });
  }

  findOne(id: string) {
    return this.repo.findOne({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }
}