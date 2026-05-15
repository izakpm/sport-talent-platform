import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AthletesService } from '../athletes/athletes.service';
import { AthleteSportsService } from '../athlete-sports/athlete-sports.service';

@Injectable()
export class RegisterService {
  constructor(
    private usersService: UsersService,
    private athletesService: AthletesService,
    private athleteSportsService: AthleteSportsService,
  ) {}

  async registerAthlete(data: any) {
    // ✅ 1. Create user
    const user = await this.usersService.create({
      email: data.email,
      password_hash: data.password,
      role: 'ATHLETE',
      first_name: data.first_name,
      last_name: data.last_name,
    });

    // ✅ 2. Create athlete profile
    const athlete = await this.athletesService.create(user.id);

    // ✅ 3. Add sports
    if (data.sports && data.sports.length > 0) {
      for (const sport of data.sports) {
        let first = true;
        for (const position_id of sport.position_ids) {
          await this.athleteSportsService.create({
            athlete_id: athlete.id,
            sport_id: sport.sport_id,
            position_id,
            is_primary: sport.is_primary && first,  // ✅ only first one is primary
          });

          first = false;
        }
      }
    }

    return {
      message: 'Athlete registered successfully',
      user,
      athlete,
    };
  }
}