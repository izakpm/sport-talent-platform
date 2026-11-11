import {Controller,GoneException,Post,UseGuards} from '@nestjs/common';
import {JwtAuthGuard} from '../auth/jwt-auth.guard';
// Legacy tokens were not bound to a team, coach or authenticated athlete.
// Session attendance is now handled by the owner-scoped team-hub routes.
@Controller('verification') @UseGuards(JwtAuthGuard)
export class VerificationController {
 @Post(['verify','token','scan','request','approve']) retired(){throw new GoneException('Use team session attendance to request or verify attendance.');}
}
