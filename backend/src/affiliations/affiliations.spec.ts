import { AffiliationsService } from './affiliations.service';
import { guardianContext } from '../guardian/guardian-context';
const user = '11111111-1111-4111-8111-111111111111',
  org = '22222222-2222-4222-8222-222222222222',
  parent = '33333333-3333-4333-8333-333333333333';
describe('organisation affiliations access boundaries', () => {
  const context = { userId: user };
  function database(role = 'ATHLETE') {
    const query = jest.fn(async (sql: string) => {
      if (sql.startsWith('SELECT role,status'))
        return [{ role, status: 'ACTIVE' }];
      if (sql.startsWith('SELECT id FROM organisations')) return [{ id: org }];
      if (sql.startsWith('SELECT l.mode')) return [{ mode: 'managed' }];
      return [];
    });
    return { query, transaction: jest.fn(async (fn: any) => fn({ query })) };
  }
  it.each(['ATHLETE', 'COACH', 'GUARDIAN'])(
    'derives %s role on the server and writes only affiliation records',
    async (role) => {
      const db = database(role);
      await new AffiliationsService(db as any).add(context, {
        organisation_id: org,
      });
      const writes = db.query.mock.calls.filter(([sql]) =>
        /^(INSERT|UPDATE|DELETE)/.test(sql),
      );
      expect(writes).toHaveLength(1);
      expect(writes[0][0]).toContain('INSERT INTO organisation_affiliations');
      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        [user, org, role, user, null],
      );
    },
  );
  it.each(['user_id', 'role', 'status', 'confirmed_by_user_id', 'visibility'])(
    'rejects client control over %s',
    async (key) => {
      const db = database();
      await expect(
        new AffiliationsService(db as any).add(context, {
          organisation_id: org,
          [key]: 'confirmed',
        }),
      ).rejects.toThrow();
      expect(db.transaction).not.toHaveBeenCalled();
    },
  );
  it.each(['2026-02-30', '2099-01-01', 'yesterday'])(
    'rejects invalid or future start %s',
    async (date) => {
      await expect(
        new AffiliationsService(database() as any).add(context, {
          organisation_id: org,
          starts_on: date,
        }),
      ).rejects.toThrow('start date');
    },
  );
  it('does not accept school/admin accounts as personal affiliations', async () => {
    await expect(
      new AffiliationsService(database('SCHOOL') as any).list(context),
    ).rejects.toThrow('active');
  });
  it('preserves managing parent identity and rechecks the live approval for writes', async () => {
    const db = database();
    await new AffiliationsService(db as any).add(
      { userId: user, actorId: parent, guardianMode: 'managed' },
      { organisation_id: org },
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR SHARE OF l,p'),
      [parent, user],
    );
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO'),
      [user, org, 'ATHLETE', parent, null],
    );
  });
  it.each([{ links: [] }, { links: [{ mode: 'view' }] }])(
    'rejects a removed or read-only parent link at write time',
    async ({ links }) => {
      const db = database();
      db.query.mockImplementation(async (sql) =>
        sql.startsWith('SELECT l.mode')
          ? links
          : ([{ role: 'ATHLETE', status: 'ACTIVE' }] as any),
      );
      await expect(
        new AffiliationsService(db as any).add(
          { userId: user, actorId: parent },
          { organisation_id: org },
        ),
      ).rejects.toThrow('managing parent');
      expect(
        db.query.mock.calls.some(([sql]) => sql.startsWith('INSERT')),
      ).toBe(false);
    },
  );
  it('scopes ending a link to its owner', async () => {
    const db = database();
    await expect(
      new AffiliationsService(db as any).end(context, org),
    ).rejects.toThrow('not found');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id=$1 AND user_id=$2'),
      [org, user],
    );
  });
  it('allows parent self affiliations without changing child permissions', async () => {
    const payload = { sub: parent, role: 'GUARDIAN' };
    expect(
      (
        await guardianContext(
          {} as any,
          { method: 'POST', path: '/affiliations', headers: {} },
          payload,
        )
      ).userId,
    ).toBe(parent);
    const req = {
      method: 'POST',
      path: '/affiliations',
      headers: { 'x-athlete-id': user },
    };
    await expect(
      guardianContext(
        { query: async () => [{ mode: 'view' }] } as any,
        req,
        payload,
      ),
    ).rejects.toThrow('read-only');
    await expect(
      guardianContext({ query: async () => [] } as any, req, payload),
    ).rejects.toThrow('not linked');
    await expect(
      guardianContext({} as any, { ...req, path: '/schools/profile' }, payload),
    ).rejects.toThrow('not available');
    expect(
      (
        await guardianContext(
          { query: async () => [{ mode: 'managed' }] } as any,
          req,
          payload,
        )
      ).actorId,
    ).toBe(parent);
  });
});
