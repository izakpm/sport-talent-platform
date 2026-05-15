import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Position } from './position.entity';

@Injectable()
export class PositionsService {
  constructor(
    @InjectRepository(Position)
    private repo: Repository<Position>,
  ) {}

  findBySport(sport_id: string) {
    return this.repo.find({ where: { sport_id } });
  }

  findAll() {
    return this.repo.find();
  }
}