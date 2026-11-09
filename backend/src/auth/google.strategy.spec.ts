import { GoogleStrategy } from './google.strategy';

describe('Google identity validation', () => {
  const auth = { findOrCreateGoogleUser: jest.fn().mockResolvedValue({ id: 'user' }) };
  const profile = { emails: [{ value: 'Test@Example.com', verified: true }], name: { givenName: 'Test', familyName: 'User' } };
  const strategy = new GoogleStrategy(auth as any);

  beforeEach(() => jest.clearAllMocks());

  it.each(['ATHLETE', 'COACH', 'GUARDIAN', 'ORG', 'SCHOOL'])('preserves the selected %s role', async role => {
    const req = { session: { oauthRole: role } };
    await strategy.validate(req as any, '', '', profile as any);
    expect(auth.findOrCreateGoogleUser).toHaveBeenCalledWith('test@example.com', 'Test', 'User', role);
    expect(req.session.oauthRole).toBeUndefined();
  });

  it('does not allow admin registration', async () => {
    await strategy.validate({ session: { oauthRole: 'ADMIN' } } as any, '', '', profile as any);
    expect(auth.findOrCreateGoogleUser).toHaveBeenCalledWith('test@example.com', 'Test', 'User', 'ATHLETE');
  });

  it('rejects unverified email before linking or creating an account', async () => {
    await expect(strategy.validate({ session: {} } as any, '', '', { ...profile, emails: [{ value: 'test@example.com', verified: false }] } as any)).rejects.toThrow('verified Google email');
    expect(auth.findOrCreateGoogleUser).not.toHaveBeenCalled();
  });
});
