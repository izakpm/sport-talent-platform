import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private repo: Repository<Activity>,
  ) {}

  // ✅ Get all activities from DB
  findAll() {
    return this.repo.find();
  }

  // ✅ Create new activity
  create(data: Partial<Activity>) {
    const activity = this.repo.create(data);
    return this.repo.save(activity);
  }
}