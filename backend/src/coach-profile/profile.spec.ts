import { profileInput } from './profile.validation';
import { CoachProfileService } from './profile.service';
import { CoachProfileController } from './profile.module';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
describe('coach profile', () => {
  it('requires authentication', () =>
    expect(
      Reflect.getMetadata(GUARDS_METADATA, CoachProfileController),
    ).toContain(JwtAuthGuard));
  it('trims names and supports optional fields being cleared', () =>
    expect(
      profileInput({
        first_name: ' Izak ',
        phone: '',
        years_experience: null,
        bio: '',
      }),
    ).toEqual({
      first_name: 'Izak',
      phone: '',
      years_experience: null,
      bio: '',
    }));
  it('rejects identity, ownership and verification changes', () => {
    for (const body of [
      { role: 'ADMIN' },
      { email: 'other@example.com' },
      { user_id: 'other' },
      { verification_status: 'VERIFIED' },
      { password_hash: 'x' },
    ])
      expect(() => profileInput(body)).toThrow();
  });
  it('validates names, phone, experience and biography', () => {
    for (const body of [
      { first_name: ' ' },
      { last_name: null },
      { phone: 'abc' },
      { years_experience: -1 },
      { years_experience: 1.5 },
      { years_experience: 81 },
      { bio: 'x'.repeat(2001) },
    ])
      expect(() => profileInput(body)).toThrow();
  });
  it('validates photo bytes and permits removal', () => {
    expect(profileInput({ profile_image: null })).toEqual({
      profile_image: null,
    });
    expect(() =>
      profileInput({ profile_image: 'data:image/png;base64,dGVzdA==' }),
    ).toThrow();
    expect(() =>
      profileInput({ profile_image: 'https://external.example/photo' }),
    ).toThrow();
    const png =
      'data:image/png;base64,' +
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64');
    expect(profileInput({ profile_image: png })).toEqual({
      profile_image: png,
    });
  });
  it('blocks non-coaches and suspended coaches before reading details', async () => {
    for (const user of [
      { role: 'ATHLETE' },
      { role: 'COACH', status: 'SUSPENDED' },
    ]) {
      const db = { query: jest.fn().mockResolvedValue([user]) };
      await expect(
        new CoachProfileService(db as any).get('owner'),
      ).rejects.toThrow();
      expect(db.query).toHaveBeenCalledTimes(1);
    }
  });
  it('scopes both account and coaching writes to the authenticated owner', async () => {
    const tx = { query: jest.fn().mockResolvedValue([{ role: 'COACH' }]) };
    const db = {
      transaction: async (fn: any) => fn(tx),
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'COACH' }])
        .mockResolvedValueOnce([{}])
        .mockResolvedValueOnce([{}]),
    };
    await new CoachProfileService(db as any).update('owner', {
      first_name: 'Izak',
      bio: 'Developing players',
    });
    for (const [, params] of tx.query.mock.calls)
      expect(params[0]).toBe('owner');
    expect(tx.query.mock.calls[1][0]).toContain('UPDATE users');
    expect(tx.query.mock.calls[3][0]).toContain('UPDATE coach_profiles');
  });
});
