import { SchoolsService } from './schools.service';
describe('school workspace access', () => {
  it.each([
    { organisation_id: 'another' },
    { is_demo: false },
    { name: '' },
    { type: 'ADMIN' },
    { email: 'invalid' },
    { website: 'javascript:alert(1)' },
    { description: 'x'.repeat(2001) },
  ])('rejects invalid profile input %p', async (body) => {
    const db = { query: jest.fn() };
    await expect(
      new SchoolsService(db as any).saveProfile('user', body),
    ).rejects.toThrow();
    expect(db.query).not.toHaveBeenCalled();
  });
  it('denies profile edits without organisation edit permission', async () => {
    const db = { transaction: jest.fn() };
    const service = new SchoolsService(db as any);
    jest
      .spyOn(service, 'workspace')
      .mockResolvedValue({
        school: { id: 'other', can_edit_profile: false },
        teams: [],
        fixtures: [],
        coaches: [],
      } as any);
    await expect(
      service.saveProfile('user', { name: 'Changed' }),
    ).rejects.toThrow('permission');
    expect(db.transaction).not.toHaveBeenCalled();
  });
  it('saves only allowed fields against the authenticated organisation', async () => {
    const query = jest.fn();
    const db = { transaction: jest.fn(async (fn) => fn({ query })) };
    const service = new SchoolsService(db as any);
    jest
      .spyOn(service, 'workspace')
      .mockResolvedValue({
        school: { id: 'own', can_edit_profile: true },
        teams: [],
        fixtures: [],
        coaches: [],
      } as any);
    await service.saveProfile('user', {
      name: ' Montana ',
      province: 'Gauteng',
      phone: '',
    });
    expect(query.mock.calls[0][1]).toEqual(['own', 'Montana', null]);
    expect(query.mock.calls[1][1]).toEqual(['own', 'Gauteng']);
  });
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
