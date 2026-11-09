import { playerInput } from './roster.validation';
import { PlanningService } from './planning.service';
import { DataSource } from 'typeorm';
const body = {
  first_name: ' Siya ',
  last_name: 'Kolisi',
  position: 'Flanker',
  shirt_number: 6,
  is_captain: true,
  status: 'active',
};
describe('team rosters', () => {
  it('trims names and permits optional roster details', () => {
    expect(playerInput(body)).toEqual([
      'Siya',
      'Kolisi',
      'Flanker',
      6,
      true,
      'active',
    ]);
    expect(playerInput({ first_name: 'Test', last_name: 'Player' })).toEqual([
      'Test',
      'Player',
      '',
      null,
      false,
      'active',
    ]);
  });
  it('rejects invalid player details', () => {
    for (const change of [
      { first_name: '' },
      { last_name: 'x'.repeat(81) },
      { position: 'Goalkeeper' },
      { shirt_number: 0 },
      { shirt_number: 100 },
      { shirt_number: 1.5 },
      { shirt_number: '6' },
      { status: 'unknown' },
      { is_captain: 'yes' },
    ])
      expect(() => playerInput({ ...body, ...change })).toThrow();
  });
  it('denies another coach’s roster without querying players', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ role: 'COACH', status: 'ACTIVE' }])
      .mockResolvedValueOnce([]);
    await expect(
      new PlanningService({ query } as unknown as DataSource).roster(
        'coach',
        'other-team',
      ),
    ).rejects.toThrow('Team not found');
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][1]).toEqual(['other-team', 'coach']);
  });
  it.each(['save', 'remove'])(
    'denies %s on another coach’s team',
    async (action) => {
      const query = jest
        .fn()
        .mockResolvedValue([{ role: 'COACH', status: 'ACTIVE' }]);
      const tx = { query: jest.fn().mockResolvedValue([]) };
      const service = new PlanningService({
        query,
        transaction: (fn) => fn(tx),
      } as unknown as DataSource);
      await expect(
        action === 'save'
          ? service.savePlayer('coach', 'other-team', body)
          : service.removePlayer('coach', 'other-team', 'player'),
      ).rejects.toThrow('Team not found');
      expect(tx.query).toHaveBeenCalledTimes(1);
    },
  );
  it('rejects an occupied active shirt number before writing', async () => {
    const tx = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ id: 'team' }])
        .mockResolvedValueOnce([{ id: 'existing' }]),
    };
    const service = new PlanningService({
      query: jest.fn().mockResolvedValue([{ role: 'COACH', status: 'ACTIVE' }]),
      transaction: (fn) => fn(tx),
    } as unknown as DataSource);
    await expect(service.savePlayer('coach', 'team', body)).rejects.toThrow(
      'shirt number',
    );
    expect(tx.query).toHaveBeenCalledTimes(2);
  });
});
