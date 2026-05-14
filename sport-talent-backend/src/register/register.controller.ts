import { Controller, Post, Body } from '@nestjs/common';
import { RegisterService } from './register.service';

@Controller('register')
export class RegisterController {
  constructor(private readonly service: RegisterService) {}

  @Post('athlete')
  registerAthlete(@Body() body: any) {
    return this.service.registerAthlete(body);
  }
}