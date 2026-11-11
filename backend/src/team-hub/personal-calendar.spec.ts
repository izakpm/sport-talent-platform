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
