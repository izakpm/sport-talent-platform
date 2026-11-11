import { ConnectionsService } from './connections.service';
it('deduplicates people across teams and only returns display fields', async () => {
  const row = {
    team_id: 'a',
    team_name: 'XV',
    age_group: 'U18',
    sport: 'Rugby',
    id: 'coach',
    first_name: 'Coach',
    last_name: 'One',
    profile_image: null,
    role: 'coach',
    email: 'private@example.com',
  };
  const db = {
    query: jest
      .fn()
      .mockResolvedValue([row, { ...row, team_id: 'b', team_name: 'Club' }]),
  };
  const hub = { authorize: jest.fn().mockResolvedValue('ATHLETE') };
  const result = await new ConnectionsService(db as any, hub as any).list(
    'athlete',
  );
  expect(hub.authorize).toHaveBeenCalledWith('athlete', 'ATHLETE');
  expect(result.people).toEqual([
    {
      id: 'coach',
      name: 'Coach One',
      profile_image: null,
      role: 'coach',
      team_ids: ['a', 'b'],
    },
  ]);
  expect(result.teams).toHaveLength(2);
});
it('does not query memberships when authorization fails', async () => {
  const db = { query: jest.fn() };
  const hub = { authorize: jest.fn().mockRejectedValue(new Error('Denied')) };
  await expect(
    new ConnectionsService(db as any, hub as any).list('coach'),
  ).rejects.toThrow('Denied');
  expect(db.query).not.toHaveBeenCalled();
});
