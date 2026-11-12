import {
  TeamInvitationsService,
  invitationHash,
} from './team-invitations.service';
const child = '11111111-1111-1111-1111-111111111111';
function setup(invite: any = {}) {
  const tx = { query: jest.fn() };
  const db = { query: tx.query, transaction: (fn: any) => fn(tx) };
  const service = new TeamInvitationsService(db as any);
  jest.spyOn(service, 'authorize').mockResolvedValue(undefined);
  jest.spyOn(service, 'ownedTeam').mockResolvedValue({ id: 'team' });
  const managed = jest
    .spyOn(service, 'managed')
    .mockResolvedValue({ id: child, first_name: 'Test', last_name: 'Child' });
  const row = {
    id: 'invite',
    team_id: 'team',
    coach_id: 'coach',
    guardian_id: 'parent',
    child_id: child,
    status: 'pending',
    expires_at: new Date(Date.now() + 60000),
    ...invite,
  };
  tx.query.mockImplementation(async (sql: string) =>
    sql.includes('SELECT * FROM team_invitations')
      ? [row]
      : sql.startsWith('SELECT id FROM coach_teams')
        ? [{ id: 'team' }]
        : [],
  );
  return { service, tx, managed };
}
it('rejects invalid tokens and stores only a stable digest', () => {
  expect(() => invitationHash('bad')).toThrow();
  expect(invitationHash('a'.repeat(43))).toHaveLength(64);
  expect(invitationHash('a'.repeat(43))).not.toContain('a'.repeat(43));
});
it.each(['confirmed', 'revoked', 'withdrawn', 'declined'])(
  'cannot accept a %s invite',
  async (status) => {
    const { service, tx } = setup({ status });
    await expect(
      service.accept('parent', {
        token: 'a'.repeat(43),
        child_id: child,
        consent: true,
      }),
    ).rejects.toThrow('no longer available');
    expect(tx.query.mock.calls.some(([sql]) => sql.startsWith('UPDATE'))).toBe(
      false,
    );
  },
);
it('requires explicit consent', async () => {
  const { service } = setup({ status: 'open' });
  await expect(
    service.accept('parent', { token: 'a'.repeat(43), child_id: child }),
  ).rejects.toThrow('confirm');
});
it('acceptance creates only pending state, never membership', async () => {
  const { service, tx } = setup({ status: 'open' });
  expect(
    await service.accept('parent', {
      token: 'a'.repeat(43),
      child_id: child,
      consent: true,
    }),
  ).toEqual({ id: 'invite', status: 'pending' });
  expect(
    tx.query.mock.calls.some(([sql]) =>
      sql.includes('INSERT INTO coach_player_accounts'),
    ),
  ).toBe(false);
});
it('rechecks guardian authority at coach confirmation', async () => {
  const { service, managed, tx } = setup();
  managed.mockRejectedValue(new Error('Parent link revoked'));
  await expect(
    service.decide('coach', 'team', 'invite', { status: 'confirmed' }),
  ).rejects.toThrow('revoked');
  expect(tx.query.mock.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(
    false,
  );
});
it('cannot confirm before parent acceptance or after expiry', async () => {
  const open = setup({ status: 'open' });
  await expect(
    open.service.decide('coach', 'team', 'invite', { status: 'confirmed' }),
  ).rejects.toThrow('parent must accept');
  const expired = setup({ expires_at: new Date(0) });
  await expect(
    expired.service.decide('coach', 'team', 'invite', { status: 'confirmed' }),
  ).rejects.toThrow('no longer active');
});
it('rejects already-linked roster entries without overwriting them', async () => {
  const { service, tx } = setup();
  tx.query.mockImplementation(async (sql: string) =>
    sql.includes('SELECT * FROM team_invitations')
      ? [
          {
            id: 'invite',
            guardian_id: 'parent',
            child_id: child,
            status: 'pending',
            expires_at: new Date(Date.now() + 60000),
          },
        ]
      : sql.includes('FROM coach_team_players')
        ? [{ id: child }]
        : sql.includes('WHERE player_id=$1 UNION')
          ? [{ exists: 1 }]
          : [],
  );
  await expect(
    service.decide('coach', 'team', 'invite', {
      status: 'confirmed',
      player_id: child,
    }),
  ).rejects.toThrow('another athlete');
  expect(tx.query.mock.calls.some(([sql]) => sql.startsWith('INSERT'))).toBe(
    false,
  );
});
