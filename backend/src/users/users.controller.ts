import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // ✅ CREATE USER
  @Post()
  createUser(@Body() body: any) {
    return this.service.create({
      email: body.email,
      password_hash: body.password, // temporary (we’ll fix later)
      role: body.role,
      first_name: body.first_name,
      last_name: body.last_name,
      phone: body.phone,
    });
  }

  // ✅ GET USER BY ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}