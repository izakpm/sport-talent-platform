import { GuardianService } from './guardian.service';
import { guardianContext } from './guardian-context';
function setup(role = 'GUARDIAN', status = 'ACTIVE') {
  const query = jest.fn().mockResolvedValue([{ id: 'parent', role, status }]);
  const db = { query, transaction: (fn: any) => fn({ query }) };
  return { service: new GuardianService(db as any), query };
}
it.each([
  { role: 'COACH' },
  { email: 'other@test.com' },
  { id: 'other' },
  { password_hash: 'x' },
  { headline: 'x' },
  { child_id: 'child' },
])(
  'rejects account or child identifiers and non-profile fields: %o',
  async (body) => {
    const { service, query } = setup();
    await expect(service.updateProfile('parent', body)).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
  },
);
it.each([
  {},
  [],
  { first_name: ' ' },
  { last_name: null },
  { phone: 'bad phone' },
  { profile_image: 'https://evil.test/a.svg' },
])('validates parent details before writes: %o', async (body) => {
  const { service, query } = setup();
  await expect(service.updateProfile('parent', body)).rejects.toThrow();
  expect(query).not.toHaveBeenCalled();
});
it.each([
  ['ATHLETE', 'ACTIVE'],
  ['COACH', 'ACTIVE'],
  ['GUARDIAN', 'SUSPENDED'],
])('blocks %s/%s from updating parent details', async (role, status) => {
  const { service, query } = setup(role, status);
  await expect(
    service.updateProfile('parent', { first_name: 'Test' }),
  ).rejects.toThrow();
  expect(query.mock.calls.some(([sql]) => sql.startsWith('UPDATE'))).toBe(
    false,
  );
});
it('updates only the authenticated parent with validated trimmed fields', async () => {
  const { service, query } = setup();
  await service.updateProfile('parent', {
    first_name: ' Test ',
    phone: '+27 82 123 4567',
    profile_image: null,
  });
  expect(query).toHaveBeenCalledWith(
    'UPDATE users SET first_name=$2,phone=$3,profile_image=$4 WHERE id=$1',
    ['parent', 'Test', '+27 82 123 4567', null],
  );
  expect(query).toHaveBeenCalledWith(
    'SELECT id,first_name,last_name,email,phone,profile_image,role FROM users WHERE id=$1',
    ['parent'],
  );
});
it('rejects editing a parent profile through delegated child context', async () => {
  await expect(
    guardianContext(
      {} as any,
      {
        path: '/guardian/profile',
        method: 'PATCH',
        headers: { 'x-athlete-id': '11111111-1111-1111-1111-111111111111' },
      },
      { sub: 'parent', role: 'GUARDIAN' },
    ),
  ).rejects.toThrow('not available');
});
