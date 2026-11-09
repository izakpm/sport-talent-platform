import { eventInput, occurrenceDates, validDate } from './planning.validation';
import { PlanningService } from './planning.service';
import { DataSource } from 'typeorm';

const session = {
  title: 'Practice',
  kind: 'practice',
  date: '2026-11-02',
  start_time: '16:00',
  end_time: '17:30',
};
describe('coach planning', () => {
  it('expands Monday and Wednesday sessions within the month, without duplicates', () => {
    expect(
      occurrenceDates('2026-11-01', {
        until: '2026-11-30',
        weekdays: [1, 3, 1],
      }),
    ).toEqual([
      '2026-11-02',
      '2026-11-04',
      '2026-11-09',
      '2026-11-11',
      '2026-11-16',
      '2026-11-18',
      '2026-11-23',
      '2026-11-25',
      '2026-11-30',
    ]);
  });
  it('handles leap days and rejects impossible dates', () => {
    expect(validDate('2028-02-29')).toBe('2028-02-29');
    expect(() => validDate('2026-02-29')).toThrow();
    expect(() => validDate('2026-13-01')).toThrow();
  });
  it('rejects empty, reversed and excessive repeats', () => {
    for (const repeat of [
      { until: '2026-11-30', weekdays: [] },
      { until: '2026-10-31', weekdays: [1] },
      { until: '2027-11-01', weekdays: [1] },
      { until: '2026-11-30', weekdays: [7] },
    ]) {
      expect(() => occurrenceDates('2026-11-01', repeat)).toThrow();
    }
  });
  it('rejects overnight, invalid and zero-length sessions', () => {
    for (const end_time of ['15:00', '16:00', '24:30', 'garbage'])
      expect(() => eventInput({ ...session, end_time })).toThrow();
    expect(eventInput(session).venue).toBe('');
  });
  it('checks the database role rather than trusting client role claims', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([{ role: 'ATHLETE', status: 'ACTIVE' }]);
    const service = new PlanningService({ query } as unknown as DataSource);
    await expect(service.teams('athlete')).rejects.toThrow('coach account');
    expect(query).toHaveBeenCalledTimes(1);
  });
  it('rejects access to another coach’s team before reading or writing events', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([{ role: 'COACH', status: 'ACTIVE' }]);
    const tx = { query: jest.fn().mockResolvedValue([]) };
    const service = new PlanningService({
      query,
      transaction: (fn) => fn(tx),
    } as unknown as DataSource);
    await expect(
      service.saveEvents('coach-a', 'team-b', session),
    ).rejects.toThrow('Team not found');
    expect(tx.query).toHaveBeenCalledTimes(1);
    expect(tx.query.mock.calls[0][1]).toEqual(['team-b', 'coach-a']);
  });
  it('checks every occurrence before inserting any sessions', async () => {
    const query = jest
      .fn()
      .mockResolvedValue([{ role: 'COACH', status: 'ACTIVE' }]);
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'team' }])
        .mockResolvedValueOnce([{ date: '2026-11-09' }]),
    };
    const service = new PlanningService({
      query,
      transaction: (fn) => fn(tx),
    } as unknown as DataSource);
    await expect(
      service.saveEvents('coach', 'team', {
        ...session,
        repeat: { until: '2026-11-30', weekdays: [1] },
      }),
    ).rejects.toThrow('nothing was saved');
    expect(tx.query).toHaveBeenCalledTimes(2);
    expect(tx.query.mock.calls[1][1][1]).toHaveLength(5);
  });
});
