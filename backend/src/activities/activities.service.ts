import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Activity } from './activity.entity';
import { ActivityVerification } from '../verification/activity-verification.entity';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private repo: Repository<Activity>,
    @InjectRepository(ActivityVerification)
    private verificationRepo: Repository<ActivityVerification>,
  ) {}

  // ✅ Get activities from DB (optionally filter by athlete_id)
  async findAll(athlete_id?: string) {
    const query = this.repo.createQueryBuilder('activity')
      .leftJoinAndSelect('activity.sport', 'sport');

    if (athlete_id) {
      query.where('activity.athlete_id = :athlete_id', { athlete_id });
    }

    const activities = await query.getMany();

    // attach verification status to each activity
    const results = await Promise.all(
      activities.map(async (a) => {
        const v = await this.verificationRepo.findOne({ where: { activity_id: a.id } });
        return {
          id: a.id,
          athlete_id: a.athlete_id,
          sport_id: a.sport_id,
          sport: a.sport?.name,
          activity_category: a.sport?.category,
          activity_type: a.activity_type,
          title: a.title,
          description: a.description,
          start_time: a.start_time,
          end_time: a.end_time,
          duration_minutes: a.duration_minutes,
          start_date: a.start_time ? a.start_time.toISOString().split('T')[0] : null,
          location: a.location,
          created_at: a.created_at,
          verification_status: v?.status || null,
          verified: v?.status === 'VERIFIED',
        };
      }),
    );

    return results;
  }

  // ✅ Create new activity
  create(data: Partial<Activity>) {
    const activity = this.repo.create(data);
    return this.repo.save(activity);
  }
}