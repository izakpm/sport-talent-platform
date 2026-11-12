import { requiresParent, birthDate } from './invitation-age';
import { TeamInvitationsService } from './team-invitations.service';
describe('invitation age rules', () => {
  it('requires approval until the 18th birthday', () => {
    expect(requiresParent('2008-11-13', '2026-11-12')).toBe(true);
    expect(requiresParent('2008-11-12', '2026-11-12')).toBe(false);
    expect(requiresParent('1995-02-28', '2026-11-12')).toBe(false);
    expect(requiresParent(null)).toBe(true);
  });
  it('handles leap birthdays without advancing adulthood early', () => {
    expect(requiresParent('2008-02-29', '2026-02-28')).toBe(true);
    expect(requiresParent('2008-02-29', '2026-03-01')).toBe(false);
  });
  it.each([undefined, '2026-02-30', '2100-01-01', '1899-01-01', 'not a date'])(
    'rejects invalid or missing birth dates %s',
    (v) => expect(() => birthDate(v)).toThrow(),
  );
});
const athlete = '11111111-1111-1111-1111-111111111111';
function setup(dob: string | null = '2010-01-01') {
  const query = jest.fn(async (sql: string): Promise<any[]> => {
    if (sql.includes('SELECT * FROM team_invitations'))
      return [
        {
          id: 'invite',
          team_id: 'team',
          coach_id: 'coach',
          status: 'open',
          expires_at: new Date(Date.now() + 60000),
        },
      ];
    if (sql.startsWith('SELECT id FROM coach_teams')) return [{ id: 'team' }];
    if (sql.startsWith('SELECT id,date_of_birth'))
      return [{ id: athlete, email: 'athlete@test.com', date_of_birth: dob }];
    return [];
  });
  const service = new TeamInvitationsService({
    query,
    transaction: (fn: any) => fn({ query }),
  } as any);
  jest.spyOn(service, 'authorize').mockResolvedValue(undefined);
  return { query, service };
}
it.each([
  ['2010-01-01', 'awaiting_parent'],
  ['1995-01-01', 'pending'],
])('routes DOB %s to %s without granting membership', async (dob, status) => {
  const { service, query } = setup(dob);
  expect(
    (
      await service.acceptAthlete(athlete, {
        token: 'a'.repeat(43),
        consent: true,
      })
    ).status,
  ).toBe(status);
  expect(
    query.mock.calls.some(([sql]) =>
      sql.includes('INSERT INTO coach_player_accounts'),
    ),
  ).toBe(false);
});
it('does not trust a supplied adult DOB over the stored minor DOB', async () => {
  const { service } = setup();
  await expect(
    service.acceptAthlete(athlete, {
      token: 'a'.repeat(43),
      consent: true,
      date_of_birth: '1990-01-01',
    }),
  ).rejects.toThrow('cannot be changed');
});
it('does not assume adulthood when birth date is missing', async () => {
  const { service } = setup(null);
  await expect(
    service.acceptAthlete(athlete, { token: 'a'.repeat(43), consent: true }),
  ).rejects.toThrow('date of birth');
});
it('rejects parent approval without an accepted guardian relationship', async () => {
  const { service, query } = setup();
  query
    .mockResolvedValueOnce([
      {
        id: 'i',
        child_id: athlete,
        status: 'awaiting_parent',
        acceptance_mode: 'athlete',
        expires_at: new Date(Date.now() + 60000),
      },
    ])
    .mockResolvedValueOnce([]);
  await expect(
    service.approveParent('stranger', 'i', {
      status: 'approved',
      guardian_confirmed: true,
    }),
  ).rejects.toThrow('accepted parent link');
});
it('requires parent attestation rather than trusting a status alone', async () => {
  const { service, query } = setup();
  await expect(
    service.approveParent('parent', 'i', { status: 'approved' }),
  ).rejects.toThrow('parent or legal guardian');
  expect(query).not.toHaveBeenCalled();
});
it('blocks coach confirmation if the approved parent link was revoked', async () => {
  const { service, query } = setup();
  query.mockResolvedValue([]);
  await expect(
    service.confirmableAthlete({ query } as any, {
      parent_required: true,
      child_id: athlete,
      guardian_id: 'parent',
      guardian_link_id: 'link',
      parent_approved_at: new Date(),
    }),
  ).rejects.toThrow('link has changed');
});
it('rechecks age at confirmation even if a request was previously considered adult', async () => {
  const { service, query } = setup();
  query.mockResolvedValue([{ id: athlete, date_of_birth: '2010-01-01' }]);
  await expect(
    service.confirmableAthlete({ query } as any, {
      child_id: athlete,
      parent_required: false,
    }),
  ).rejects.toThrow('Parent approval is required');
});
