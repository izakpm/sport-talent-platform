import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Athlete } from './athlete.entity';
import { AthleteSport } from '../athlete-sports/athlete-sport.entity';

@Injectable()
export class AthletesService { 
  constructor(
    @InjectRepository(Athlete)
    private repo: Repository<Athlete>,

    @InjectRepository(AthleteSport)
    private sportRepo: Repository<AthleteSport>, // ✅ ADD THIS
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
  
  async createProfile(data: any) {
    const athlete = this.repo.create({
      user_id: data.user_id,
      nationality: data.nationality,
      province: data.province,
      profile_visibility: 'PRIVATE',
    });

    return this.repo.save(athlete);
  }

  async addSports(data: any) {
    const records = data.sports.map((s: any) => ({
      athlete_id: data.athlete_id,
      sport_id: s.sport_id,
      position_id: s.position_id,
      is_primary: s.is_primary || false,
    }));

    return this.sportRepo.save(records);
  }
}