import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AthletesModule } from '../athletes/athletes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AthletesModule,   // ✅ ADD THIS
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
