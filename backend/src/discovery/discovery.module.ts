import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { Athlete } from '../athletes/athlete.entity';
import { User } from '../users/user.entity';
import { AthleteSport } from '../athlete-sports/athlete-sport.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete, User, AthleteSport])],
  providers: [DiscoveryService],
  controllers: [DiscoveryController],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
