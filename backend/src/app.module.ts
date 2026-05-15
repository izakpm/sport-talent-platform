import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// ✅ Import your feature modules
import { ActivitiesModule } from './activities/activities.module';
import { VerificationModule } from './verification/verification.module';
import { TrustController } from './trust/trust.controller';
import { TrustService } from './trust/trust.service';
import { TrustModule } from './trust/trust.module';
import { AthleteSportsModule } from './athlete-sports/athlete-sports.module';
import { UsersModule } from './users/users.module';
import { AthletesModule } from './athletes/athletes.module';
import { SportsModule } from './sports/sports.module';
import { PositionsModule } from './positions/positions.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ✅ Load environment variables (.env file)
    ConfigModule.forRoot(),

    // ✅ Database connection (Supabase PostgreSQL)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,

      autoLoadEntities: true,
      synchronize: false,

      ssl: {
        rejectUnauthorized: false,
      },
    }),

    // ✅ Register your modules here
    ActivitiesModule,

    VerificationModule,

    TrustModule,

    AthleteSportsModule,

    UsersModule,

    AthletesModule,

    SportsModule,

    PositionsModule,

    AuthModule,
  ],
  controllers: [TrustController],
  providers: [TrustService],
})
export class AppModule {}