import { guardianContext } from './guardian-context';
import { GuardianService } from './guardian.service';
const parent = '22222222-2222-2222-2222-222222222222',
  child = '11111111-1111-1111-1111-111111111111';
const payload = { sub: parent, role: 'GUARDIAN', email: 'parent@test.com' };
const req = (method = 'GET', path = '/athlete-profile') => ({
  method,
  path,
  headers: { 'x-athlete-id': child },
});
describe('guardian authorization boundaries', () => {
  it('keeps ordinary sessions unchanged', async () => {
    expect(
      await guardianContext(
        {} as any,
        { headers: {}, path: '/guardian/children' },
        payload,
      ),
    ).toEqual({
      userId: parent,
      role: 'GUARDIAN',
      email: 'parent@test.com',
    });
  });
  it('requires an accepted live relationship and retains actor identity', async () => {
    const db = { query: jest.fn().mockResolvedValue([{ mode: 'managed' }]) };
    expect(await guardianContext(db as any, req('PATCH'), payload)).toEqual({
      userId: child,
      role: 'ATHLETE',
      actorId: parent,
      guardianMode: 'managed',
    });
    expect(db.query.mock.calls[0][0]).toContain("l.status='accepted'");
    expect(db.query.mock.calls[0][1]).toEqual([parent, child]);
  });
  it('denies unlinked or revoked relationships', async () => {
    await expect(
      guardianContext(
        { query: jest.fn().mockResolvedValue([]) } as any,
        req(),
        payload,
      ),
    ).rejects.toThrow('not linked');
  });
  it('denies delegation from athlete or coach sessions', async () => {
    for (const role of ['ATHLETE', 'COACH'])
      await expect(
        guardianContext({} as any, req(), { ...payload, role }),
      ).rejects.toThrow('Invalid child');
  });
  it.each([
    '/users/' + child,
    '/auth/me',
    '/guardian/requests',
    '/coach-planning/teams',
  ])('blocks delegation to %s', async (path) => {
    await expect(
      guardianContext({} as any, req('GET', path), payload),
    ).rejects.toThrow();
  });
  it.each([
    '/athlete-profile',
    '/team-hub/calendar',
    '/team-hub/feed',
    '/team-hub/matches',
  ])('permits approved read-only view of %s', async (path) => {
    expect(
      (
        await guardianContext(
          { query: jest.fn().mockResolvedValue([{ mode: 'view' }]) } as any,
          req('GET', path),
          payload,
        )
      ).userId,
    ).toBe(child);
  });
  it('rejects linked parent writes and unrelated reads', async () => {
    const db = { query: jest.fn().mockResolvedValue([{ mode: 'view' }]) };
    await expect(
      guardianContext(db as any, req('PATCH'), payload),
    ).rejects.toThrow('read-only');
    await expect(
      guardianContext(db as any, req('GET', '/activities'), payload),
    ).rejects.toThrow('outside');
  });
  it('does not allow a managed parent to issue attendance codes or approve attendance', async () => {
    const db = { query: jest.fn().mockResolvedValue([{ mode: 'managed' }]) };
    await expect(
      guardianContext(
        db as any,
        req('POST', '/team-hub/sessions/' + child + '/code'),
        payload,
      ),
    ).rejects.toThrow();
  });
  it('creates no child without guardian confirmation or with an adult date', async () => {
    const service = new GuardianService({
      query: jest.fn().mockResolvedValue([{ role: 'GUARDIAN' }]),
    } as any);
    await expect(
      service.create(parent, {
        first_name: 'Child',
        last_name: 'Test',
        date_of_birth: '2016-01-01',
      }),
    ).rejects.toThrow('Confirm');
    await expect(
      service.create(parent, {
        first_name: 'Child',
        last_name: 'Test',
        date_of_birth: '2000-01-01',
        guardian_confirmed: true,
      }),
    ).rejects.toThrow('under 18');
  });
  it('restricts athlete approval to their own view-only relationships', async () => {
    const db = { query: jest.fn().mockResolvedValue([{ role: 'ATHLETE' }]) };
    const service = new GuardianService(db as any);
    await service.decide(child, parent, { status: 'accepted' });
    expect(db.query.mock.calls[1][0]).toContain("child_id=$2 AND mode='view'");
    expect(db.query.mock.calls[1][1]).toEqual([parent, child, 'accepted']);
  });
});
