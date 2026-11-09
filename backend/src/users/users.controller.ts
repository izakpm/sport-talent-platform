import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AccountRequest = { user: { userId: string } };
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}
  private ownAccount(req: AccountRequest, id: string) {
    if (req.user.userId !== id)
      throw new ForbiddenException(
        'You can only access your own account details.',
      );
  }
  private account(user: any) {
    if (!user) throw new NotFoundException('Account not found.');
    const { password_hash, ...safe } = user;
    return safe;
  }
  @Get(':id')
  async findOne(
    @Req() req: AccountRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    this.ownAccount(req, id);
    return this.account(await this.service.findOne(id));
  }
  @Get('role/:role')
  async findByRole(@Param('role') role: string) {
    const users = await this.service.findByRole(role);
    return users.map(({ id, first_name, last_name, role, profile_image }) => ({
      id,
      first_name,
      last_name,
      role,
      profile_image,
    }));
  }
  @Patch(':id')
  async update(
    @Req() req: AccountRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: any,
  ) {
    this.ownAccount(req, id);
    const allowed = new Set([
      'first_name',
      'last_name',
      'phone',
      'profile_image',
    ]);
    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body) ||
      !Object.keys(body).length ||
      Object.keys(body).some((key) => !allowed.has(key))
    ) {
      throw new BadRequestException(
        'Only profile details can be changed here.',
      );
    }
    for (const [key, value] of Object.entries(body)) {
      if (
        value !== null &&
        (typeof value !== 'string' ||
          value.length > (key === 'profile_image' ? 4500000 : 160))
      )
        throw new BadRequestException('Invalid profile details.');
    }
    return this.account(await this.service.update(id, body));
  }
}
