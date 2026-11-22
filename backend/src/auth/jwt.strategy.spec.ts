import { JwtStrategy } from './jwt.strategy';

describe('JWT session revocation', () => {
  const db = { query: jest.fn() };
  const strategy = new JwtStrategy(db as any);
  const payload = {
    sub: '00000000-0000-4000-8000-000000000001',
    role: 'ATHLETE',
    email: 'athlete@example.com',
  };
  it('accepts existing sessions at version zero', async () => {
    db.query.mockResolvedValue([{ session_version: 0, status: 'ACTIVE' }]);
    expect(await strategy.validate({ headers: {} }, payload)).toMatchObject({
      userId: payload.sub,
    });
  });
  it('rejects a session issued before a password change', async () => {
    db.query.mockResolvedValue([{ session_version: 1, status: 'ACTIVE' }]);
    await expect(strategy.validate({ headers: {} }, payload)).rejects.toThrow(
      'Please log in again',
    );
  });
  it('rejects a suspended account', async () => {
    db.query.mockResolvedValue([{ session_version: 0, status: 'SUSPENDED' }]);
    await expect(strategy.validate({ headers: {} }, payload)).rejects.toThrow();
  });
  it('does not allow account changes through child delegation', async () => {
    db.query.mockResolvedValue([{ session_version: 0, status: 'ACTIVE' }]);
    await expect(
      strategy.validate(
        {
          headers: { 'x-athlete-id': payload.sub },
          path: '/auth/change-password',
          method: 'POST',
        },
        { ...payload, role: 'GUARDIAN' },
      ),
    ).rejects.toThrow('not available in a child workspace');
  });
  it('allows parents to manage their own security', async () => {
    db.query.mockResolvedValue([{ session_version: 0, status: 'ACTIVE' }]);
    expect(
      await strategy.validate(
        { headers: {}, path: '/auth/security', method: 'GET' },
        { ...payload, role: 'GUARDIAN' },
      ),
    ).toMatchObject({ role: 'GUARDIAN' });
  });
});
