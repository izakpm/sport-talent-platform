import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Athlete } from '../athletes/athlete.entity';
import { AthleteSport } from '../athlete-sports/athlete-sport.entity';
import { User } from '../users/user.entity';

@Injectable()
export class DiscoveryService {
  constructor(
    @InjectRepository(Athlete)
    private athleteRepo: Repository<Athlete>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(AthleteSport)
    private athleteSportRepo: Repository<AthleteSport>,
  ) {}

  async searchAthletes(filters: {
    sport_id?: string;
    position_id?: string;
    query?: string;
    public_only?: boolean;
  }) {
    const qb = this.athleteRepo.createQueryBuilder('athlete')
      .leftJoin(AthleteSport, 'sport', 'sport.athlete_id = athlete.id');

    if (filters.sport_id) {
      qb.andWhere('sport.sport_id = :sport_id', { sport_id: filters.sport_id });
    }

    if (filters.position_id) {
      qb.andWhere('sport.position_id = :position_id', {
        position_id: filters.position_id,
      });
    }

    if (filters.query) {
      qb.andWhere(
        '(athlete.nationality ILIKE :query OR athlete.province ILIKE :query)',
        { query: `%${filters.query}%` },
      );
    }

    if (filters.public_only) {
      qb.andWhere('athlete.profile_visibility = :visibility', {
        visibility: 'PUBLIC',
      });
    }

    qb.groupBy('athlete.id');
    return qb.getMany();
  }

  async searchCoaches(filters: { query?: string }) {
    const qb = this.userRepo.createQueryBuilder('user');
    qb.where('user.role = :role', { role: 'coach' });

    if (filters.query) {
      qb.andWhere(
        '(user.first_name ILIKE :query OR user.last_name ILIKE :query OR user.email ILIKE :query)',
        { query: `%${filters.query}%` },
      );
    }

    return qb.getMany();
  }
}
