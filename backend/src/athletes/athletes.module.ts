import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from './athlete.entity';
import { AthletesService } from './athletes.service';
import { AthletesController } from './athletes.controller';
import { AthleteSport } from '../athlete-sports/athlete-sport.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete, AthleteSport])],
  providers: [AthletesService],
  controllers: [AthletesController],
  exports: [AthletesService],
})
export class AthletesModule {}
