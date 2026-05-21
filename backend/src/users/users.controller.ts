import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { Patch } from '@nestjs/common';

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
      profile_image: body.profile_image,
    });
  }

  // ✅ GET USER BY ID
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ✅ GET USERS BY ROLE
  @Get('role/:role')
  findByRole(@Param('role') role: string) {
    return this.service.findByRole(role);
  }
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.update(id, body);
  }
}