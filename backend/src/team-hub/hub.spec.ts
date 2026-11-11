import { HubService, checkWindow } from './hub.service';
import { HubController } from './hub.module';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
describe('team hub security', () => {
  const event = {
    cancelled: false,
    starts_at: '2026-11-11T14:00:00Z',
    ends_at: '2026-11-11T15:00:00Z',
  };
  it('requires authentication on all hub routes', () =>
    expect(Reflect.getMetadata(GUARDS_METADATA, HubController)).toContain(
      JwtAuthGuard,
    ));
  it('only permits QR check-ins in the session window', () => {
    expect(() =>
      checkWindow(event, Date.parse('2026-11-11T13:30:00Z')),
    ).not.toThrow();
    for (const time of ['2026-11-11T13:29:59Z', '2026-11-11T16:00:01Z'])
      expect(() => checkWindow(event, Date.parse(time))).toThrow();
    expect(() =>
      checkWindow(
        { ...event, cancelled: true },
        Date.parse('2026-11-11T14:00:00Z'),
      ),
    ).toThrow();
  });
  it('blocks suspended users and role mismatches before accessing records', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValue([{ role: 'ATHLETE', status: 'SUSPENDED' }]),
    };
    await expect(new HubService(db as any).teams('user')).rejects.toThrow();
    expect(db.query).toHaveBeenCalledTimes(1);
    db.query.mockResolvedValue([{ role: 'ATHLETE' }]);
    await expect(
      new HubService(db as any).pending('athlete'),
    ).rejects.toThrow();
  });
  it('rejects foreign coach sessions before issuing codes', async () => {
    const tx = { query: jest.fn().mockResolvedValue([]) };
    const db = {
      query: jest.fn().mockResolvedValue([{ role: 'COACH' }]),
      transaction: async (fn: any) => fn(tx),
    };
    await expect(
      new HubService(db as any).issue('coach', 'foreign'),
    ).rejects.toThrow('Session not found');
    expect(tx.query).toHaveBeenCalledTimes(1);
    expect(tx.query.mock.calls[0][1]).toEqual(['foreign', 'coach']);
  });
  it('rejects inactive or unlinked players', async () => {
    const db = { query: jest.fn().mockResolvedValue([]) };
    await expect(
      new HubService(db as any).member('athlete', 'team'),
    ).rejects.toThrow('link your athlete account');
    expect(db.query.mock.calls[0][0]).toContain("p.status='active'");
  });
  it('does not accept malformed or expired scan codes', async () => {
    const tx = { query: jest.fn().mockResolvedValue([]) };
    const db = {
      query: jest.fn().mockResolvedValue([{ role: 'ATHLETE' }]),
      transaction: async (fn: any) => fn(tx),
    };
    const service = new HubService(db as any);
    await expect(
      service.scan('athlete', { code: 'INVALID' }, true),
    ).rejects.toThrow('invalid');
    expect(tx.query).not.toHaveBeenCalled();
    await expect(
      service.scan('athlete', { code: 'a'.repeat(43) }, true),
    ).rejects.toThrow('expired');
    expect(tx.query.mock.calls[0][1][0]).not.toEqual('a'.repeat(43));
    expect(tx.query.mock.calls[0][0]).toContain('c.expires_at>now()');
  });
  it('restricts team posts to the owner', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'COACH' }])
        .mockResolvedValueOnce([]),
    };
    await expect(
      new HubService(db as any).post('coach', {
        team_id: '11111111-1111-4111-8111-111111111111',
        title: 'Test',
        body: 'Test',
        category: 'reminder',
      }),
    ).rejects.toThrow('Team not found');
    expect(db.query).toHaveBeenCalledTimes(2);
  });
});
