import {
  AccountSecurityService,
  validateNewPassword,
} from './account-security.service';
import * as bcrypt from 'bcrypt';

describe('Account security', () => {
  const user = {
    id: 'u',
    email: 'coach@example.com',
    password_hash: 'old-password',
    password_login_enabled: true,
  };
  const db = { query: jest.fn(), transaction: jest.fn() };
  const mail = { assertConfigured: jest.fn(), send: jest.fn() };
  const service = new AccountSecurityService(db as any, mail as any);
  beforeEach(() => {
    jest.resetAllMocks();
    db.transaction.mockImplementation((fn) => fn(db));
  });
  it('enforces length and the bcrypt UTF-8 byte limit', () => {
    expect(() => validateNewPassword('short')).toThrow();
    expect(() => validateNewPassword('😃'.repeat(20))).toThrow();
    expect(() => validateNewPassword('a long passphrase')).not.toThrow();
  });
  it('does not change credentials when the current password is wrong', async () => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([user]);
    await expect(
      service.change('u', 'wrong', 'new-password-long'),
    ).rejects.toThrow('current password is incorrect');
    expect(
      db.query.mock.calls.some(([sql]) => sql.startsWith('UPDATE users')),
    ).toBe(false);
  });
  it.each([
    { ...user, email: null },
    { ...user, password_login_enabled: false },
  ])('blocks managed and Google-only password changes', async (account) => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([account]);
    await expect(
      service.change('u', 'old-password', 'new-password-long'),
    ).rejects.toThrow('does not use');
  });
  it('hashes the new password, revokes sessions and invalidates reset links', async () => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([user])
      .mockResolvedValue([]);
    await service.change('u', 'old-password', 'new-password-long');
    const update = db.query.mock.calls.find(([sql]) =>
      sql.startsWith('UPDATE users'),
    )!;
    expect(update[0]).toContain('session_version=session_version+1');
    expect(await bcrypt.compare('new-password-long', update[1][1])).toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      'DELETE FROM password_reset_tokens WHERE user_id=$1',
      ['u'],
    );
  });
  it('returns the same recovery message for unknown and managed accounts', async () => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([]);
    const unknown = await service.forgot('unknown@example.com', 'ip');
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ ...user, password_hash: '!managed:x' }]);
    expect(await service.forgot(user.email, 'ip')).toEqual(unknown);
    expect(mail.send).not.toHaveBeenCalled();
  });
  it('sends Google guidance without creating a reset token', async () => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ ...user, password_login_enabled: false }]);
    await service.forgot(user.email, 'ip');
    expect(mail.send).toHaveBeenCalledWith(user.email, undefined);
    expect(db.transaction).not.toHaveBeenCalled();
  });
  it('stores only the token hash and uses the configured frontend origin', async () => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([user])
      .mockResolvedValue([]);
    await service.forgot(user.email, 'ip');
    const link = mail.send.mock.calls[0][1];
    expect(link).toContain('/reset-password#token=');
    const raw = link.split('#token=')[1];
    const insert = db.query.mock.calls.find(([sql]) =>
      sql.includes('INSERT INTO password_reset_tokens'),
    )!;
    expect(insert[1][0]).not.toEqual(raw);
    expect(insert[1][0]).toHaveLength(64);
  });
  it('does not mail when throttled', async () => {
    db.query.mockResolvedValue([{ attempts: 21 }]);
    await service.forgot(user.email, 'ip');
    expect(mail.send).not.toHaveBeenCalled();
  });
  it('rejects expired or already used reset tokens after acquiring the user lock', async () => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ user_id: 'u' }])
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce([]);
    await expect(
      service.reset('a'.repeat(64), 'new-password-long', 'ip'),
    ).rejects.toThrow('invalid or has expired');
    expect(
      db.query.mock.calls.some(([sql]) => sql.startsWith('UPDATE users')),
    ).toBe(false);
  });
  it('consumes a valid reset and revokes old sessions', async () => {
    db.query
      .mockResolvedValueOnce([{ attempts: 1 }])
      .mockResolvedValueOnce([{ user_id: 'u' }])
      .mockResolvedValueOnce([user])
      .mockResolvedValueOnce([{ token_hash: 'hash' }])
      .mockResolvedValue([]);
    await service.reset('a'.repeat(64), 'new-password-long', 'ip');
    expect(
      db.query.mock.calls.find(([sql]) => sql.startsWith('UPDATE users'))?.[0],
    ).toContain('session_version=session_version+1');
  });
});
