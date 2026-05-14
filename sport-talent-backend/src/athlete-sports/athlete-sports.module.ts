import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AthleteSport } from './athlete-sport.entity';
import { AthleteSportsService } from './athlete-sports.service';
import { AthleteSportsController } from './athlete-sports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AthleteSport])],
  providers: [AthleteSportsService],
  controllers: [AthleteSportsController],
  exports: [AthleteSportsService],
})
export class AthleteSportsModule {}