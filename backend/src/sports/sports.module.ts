import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sport } from './sport.entity';
import { SportsService } from './sports.service';
import { SportsController } from './sports.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Sport])],
  providers: [SportsService],
  controllers: [SportsController],
})
export class SportsModule {}