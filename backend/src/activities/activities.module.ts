import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { Activity } from './activity.entity';
import { ActivityVerification } from '../verification/activity-verification.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Activity, ActivityVerification])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}