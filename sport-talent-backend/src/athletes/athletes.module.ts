import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from './athlete.entity';
import { AthletesService } from './athletes.service';
import { AthletesController } from './athletes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete])],
  providers: [AthletesService],
  controllers: [AthletesController],
  exports: [AthletesService],
})
export class AthletesModule {}
