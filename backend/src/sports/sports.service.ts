import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sport } from './sport.entity';

@Injectable()
export class SportsService {
  constructor(
    @InjectRepository(Sport)
    private repo: Repository<Sport>,
  ) {}

  findAll() {
    return this.repo.find();
  }
}