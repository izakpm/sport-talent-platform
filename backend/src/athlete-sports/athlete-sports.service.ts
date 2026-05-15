import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AthleteSport } from './athlete-sport.entity';

@Injectable()
export class AthleteSportsService {
  constructor(
    @InjectRepository(AthleteSport)
    private repo: Repository<AthleteSport>,
  ) {}

  create(data: Partial<AthleteSport>) {
    const record = this.repo.create(data);
    return this.repo.save(record);
  }

  findByAthlete(athlete_id: string) {
    return this.repo.find({
      where: { athlete_id },
    });
  }
}