import { SchoolsService } from './schools.service';
describe('school workspace access', () => {
  it.each(['ATHLETE', 'COACH', 'GUARDIAN', null])(
    'rejects non-school role %s',
    async (role) => {
      const db = { query: jest.fn().mockResolvedValue(role ? [{ role }] : []) };
      await expect(
        new SchoolsService(db as any).workspace('user'),
      ).rejects.toThrow('school account');
      expect(db.query).toHaveBeenCalledTimes(1);
    },
  );
  it('returns empty workspace when no membership exists', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'SCHOOL' }])
        .mockResolvedValueOnce([]),
    };
    await expect(
      new SchoolsService(db as any).workspace('user'),
    ).resolves.toEqual({ school: null, teams: [], fixtures: [] });
  });
  it('scopes teams and both fixture sides to the authenticated membership', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'SCHOOL' }])
        .mockResolvedValueOnce([{ id: 'own-school', name: 'Montana' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]),
    };
    await new SchoolsService(db as any).workspace('user');
    expect(db.query.mock.calls[1][1]).toEqual(['user']);
    expect(db.query.mock.calls[2][1]).toEqual(['own-school']);
    expect(db.query.mock.calls[3][1]).toEqual(['own-school']);
    expect(db.query.mock.calls[4][1]).toEqual(['own-school']);
    expect(db.query.mock.calls[4][0]).toContain("u.role='COACH'");
    expect(db.query.mock.calls[3][0]).toContain(
      'WHERE h.organisation_id=$1 OR a.organisation_id=$1',
    );
  });
});
