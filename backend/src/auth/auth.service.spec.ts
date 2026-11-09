import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const users = { findByEmail: jest.fn(), create: jest.fn() };
  const jwt = { sign: jest.fn().mockReturnValue('signed-token') };
  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(users as any, jwt as any);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it.each(['ATHLETE', 'COACH', 'GUARDIAN', 'ORG', 'SCHOOL'])('creates a new %s account', async role => {
    users.findByEmail.mockResolvedValue(null);
    users.create.mockImplementation(async data => ({ id: 'new-user', ...data }));
    const user = await service.findOrCreateGoogleUser('test@example.com', 'Test', 'User', role);
    expect(user.role).toBe(role === 'ORG' ? 'SCHOOL' : role);
    expect(user.password_hash).toMatch(/^\$2/);
  });

  it('logs in an existing user without changing role or exposing the password hash', async () => {
    const existing = { id: 'existing', email: 'test@example.com', role: 'COACH', password_hash: 'private' };
    users.findByEmail.mockResolvedValue(existing);
    expect(await service.findOrCreateGoogleUser(existing.email, 'Test', 'User', 'ATHLETE')).toBe(existing);
    expect(users.create).not.toHaveBeenCalled();
    expect((await service.loginWithUser(existing)).user).not.toHaveProperty('password_hash');
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'existing', email: existing.email, role: 'COACH' });
  });
});
