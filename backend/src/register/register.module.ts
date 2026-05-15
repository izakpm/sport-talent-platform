import { Module } from '@nestjs/common';
import { RegisterService } from './register.service';
import { RegisterController } from './register.controller';
import { UsersModule } from '../users/users.module';
import { AthletesModule } from '../athletes/athletes.module';
import { AthleteSportsModule } from '../athlete-sports/athlete-sports.module';

@Module({
  imports: [
    UsersModule,
    AthletesModule,
    AthleteSportsModule,
  ],
  providers: [RegisterService],
  controllers: [RegisterController],
})
export class RegisterModule {}