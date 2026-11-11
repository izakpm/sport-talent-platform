import { DiscoveryService } from './discovery.service';
it('excludes contact and credential columns from coach discovery', async () => {
  const qb: any = {
    select: jest.fn(),
    where: jest.fn(),
    andWhere: jest.fn(),
    getMany: jest.fn().mockResolvedValue([]),
  };
  qb.select.mockReturnValue(qb);
  const repo: any = { createQueryBuilder: () => qb };
  await new DiscoveryService({} as any, repo, {} as any).searchCoaches({
    query: 'Izak',
  });
  expect(qb.select).toHaveBeenCalledWith([
    'user.id',
    'user.first_name',
    'user.last_name',
    'user.role',
    'user.profile_image',
  ]);
  expect(qb.andWhere.mock.calls[0][0]).not.toContain('email');
});
