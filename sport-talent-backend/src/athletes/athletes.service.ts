import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Athlete } from './athlete.entity';

@Injectable()
export class AthletesService {
  constructor(
    @InjectRepository(Athlete)
    private repo: Repository<Athlete>,
  ) {}

  create(user_id: string) {
    const athlete = this.repo.create({ user_id });
    return this.repo.save(athlete);
  }

  findByUser(user_id: string) {
    return this.repo.findOne({
      where: { user_id },
    });
  }
}