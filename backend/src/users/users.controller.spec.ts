import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
const account = {
  id: 'me',
  email: 'me@example.com',
  first_name: 'Test',
  role: 'COACH',
  password_hash: 'secret',
};
describe('account privacy', () => {
  const service = {
    findOne: jest.fn(),
    update: jest.fn(),
    findByRole: jest.fn(),
  };
  const controller = new UsersController(service as unknown as UsersService);
  beforeEach(() => {
    jest.clearAllMocks();
    service.findOne.mockResolvedValue(account);
    service.update.mockResolvedValue(account);
    service.findByRole.mockResolvedValue([account]);
  });
  it('requires authentication for profile routes', () => {
    expect(Reflect.getMetadata(GUARDS_METADATA, UsersController)).toContain(
      JwtAuthGuard,
    );
  });
  it('returns own account without its password hash', async () => {
    expect(
      await controller.findOne({ user: { userId: 'me' } }, 'me'),
    ).not.toHaveProperty('password_hash');
  });
  it('rejects cross-account reads and writes', async () => {
    await expect(
      controller.findOne({ user: { userId: 'other' } }, 'me'),
    ).rejects.toThrow('own account');
    await expect(
      controller.update({ user: { userId: 'other' } }, 'me', {
        first_name: 'Changed',
      }),
    ).rejects.toThrow('own account');
    expect(service.findOne).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
  });
  it('prevents role, password and email changes through profile updates', async () => {
    for (const body of [
      { role: 'ADMIN' },
      { password_hash: 'password' },
      { email: 'other@example.com' },
    ])
      await expect(
        controller.update({ user: { userId: 'me' } }, 'me', body),
      ).rejects.toThrow('Only profile');
    expect(service.update).not.toHaveBeenCalled();
  });
  it('allows profile photo updates without exposing credentials', async () => {
    expect(
      await controller.update({ user: { userId: 'me' } }, 'me', {
        profile_image: 'data:image/png;base64,test',
      }),
    ).not.toHaveProperty('password_hash');
  });
  it('excludes emails and credentials from the role directory', async () => {
    const [result] = await controller.findByRole('COACH');
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('password_hash');
  });
});
