import {
  personalInput,
  PersonalCalendarService,
} from './personal-calendar.service';
const body = {
  title: 'Extra gym',
  kind: 'gym',
  date: '2077-03-14',
  start_time: '16:00',
  end_time: '17:00',
  venue: 'Gym',
  notes: 'Strength work',
};
describe('personal calendar', () => {
  it('accepts future personal plans', () =>
    expect(personalInput(body)).toMatchObject({
      title: 'Extra gym',
      date: '2077-03-14',
      start: '16:00',
      end: '17:00',
    }));
  it.each([
    { user_id: 'someone' },
    { cancelled: true },
    { source: 'team' },
    { title: '' },
    { kind: 'unknown' },
    { date: '2077-02-30' },
    { date: '2020-01-01' },
    { start_time: '24:00' },
    { end_time: '15:00' },
    { end_time: '16:00' },
    { notes: 'x'.repeat(2001) },
    { invitee_id: 'not-a-person' },
    { invitee_id: [] },
    { invitation_status: 'accepted' },
  ])('rejects invalid/privileged changes %j', (patch) =>
    expect(() => personalInput({ ...body, ...patch })).toThrow(),
  );
  it('requires an active athlete account', async () => {
    const service = new PersonalCalendarService({} as any);
    await expect(
      service.authorize('coach', { query: async () => [{ role: 'COACH' }] }),
    ).rejects.toThrow();
    await expect(
      service.authorize('athlete', {
        query: async () => [{ role: 'ATHLETE', status: 'SUSPENDED' }],
      }),
    ).rejects.toThrow();
  });
});

describe('personal session invitations', () => {
  it('checks active connections before saving a guest', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'ATHLETE' }])
        .mockResolvedValueOnce([]),
    };
    const service = new PersonalCalendarService({
      transaction: (fn: any) => fn(tx),
    } as any);
    await expect(
      service.save('owner', {
        ...body,
        invitee_id: '22222222-2222-2222-2222-222222222222',
      }),
    ).rejects.toThrow('active connections');
    expect(tx.query.mock.calls.some(([q]) => q.includes('INSERT'))).toBe(false);
  });
  it('rejects an approval for an outdated plan without writing a decision', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'guest' }])
        .mockResolvedValueOnce([{ id: 'event' }])
        .mockResolvedValueOnce([
          {
            id: 'event',
            invited_at: '2026-11-23T10:00:00Z',
            starts_at: '2077-03-14T14:00:00Z',
            cancelled: false,
          },
        ]),
    };
    const service = new PersonalCalendarService({
      transaction: (fn: any) => fn(tx),
    } as any);
    await expect(
      service.respond('guest', 'event', {
        status: 'accepted',
        invited_at: '2026-11-23T09:00:00Z',
      }),
    ).rejects.toThrow('plan has changed');
    expect(tx.query.mock.calls.some(([q]) => q.startsWith('UPDATE '))).toBe(
      false,
    );
  });
  it('does not accept a response without the invitation version', async () => {
    const service = new PersonalCalendarService({} as any);
    await expect(
      service.respond('guest', 'event', { status: 'accepted' }),
    ).rejects.toThrow('current invitation');
  });
});

describe('personal session mutation responses', () => {
  it('returns the edited event as an object through a SELECT result', async () => {
    const row = { id: 'event', date: body.date, venue: 'Updated field' };
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'ATHLETE' }])
        .mockResolvedValueOnce([{ cancelled: false }])
        .mockResolvedValueOnce([row])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{}]),
    };
    const service = new PersonalCalendarService({
      transaction: (fn: any) => fn(tx),
    } as any);
    expect(
      await service.save('child', { ...body, venue: row.venue }, 'event'),
    ).toEqual(row);
    expect(tx.query.mock.calls[2][0]).toContain('SELECT * FROM updated');
    expect(tx.query.mock.calls[2][1][0]).toBe('child');
  });
  it('returns cancellation state and rejects unknown or other-user sessions', async () => {
    const row = { id: 'event', date: body.date, cancelled: true };
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'ATHLETE' }])
        .mockResolvedValueOnce([row]),
    };
    const service = new PersonalCalendarService({
      transaction: (fn: any) => fn(tx),
    } as any);
    expect(await service.cancel('child', 'event')).toEqual(row);
    expect(tx.query.mock.calls[1][0]).toContain('SELECT * FROM updated');
    expect(tx.query.mock.calls[1][1]).toEqual(['child', 'event']);
    tx.query
      .mockResolvedValueOnce([{ role: 'ATHLETE' }])
      .mockResolvedValueOnce([]);
    await expect(
      service.cancel('child', 'someone-elses-event'),
    ).rejects.toThrow('not found');
  });
});
