import { HubService } from './hub.service';
describe('athlete team calendar', () => {
  it('requires an athlete account', async () => {
    const db = {
      query: jest.fn().mockResolvedValue([{ role: 'COACH', status: 'ACTIVE' }]),
    };
    await expect(
      new HubService(db as any).calendar('coach', '2026-11'),
    ).rejects.toThrow();
  });
  it.each([
    '',
    '2026-00',
    '2026-13',
    '2100-01',
    '2026-11-01',
    "2026-11' OR 1=1",
    undefined,
  ])('rejects invalid month %s', async (month) => {
    const service = new HubService({ query: jest.fn() } as any);
    jest.spyOn(service, 'authorize').mockResolvedValue('ATHLETE');
    await expect(service.calendar('athlete', month as any)).rejects.toThrow();
  });
  it('uses a parameterized month and the signed-in membership scope', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new HubService({ query } as any);
    jest.spyOn(service, 'authorize').mockResolvedValue('ATHLETE');
    await service.calendar('athlete', '2027-02');
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("p.status='active'"),
      ['athlete', '2027-02-01'],
    );
    expect(query.mock.calls[0][0]).toContain("interval '1 month'");
    expect(query.mock.calls[0][0]).toContain('m.user_id=$1');
  });
});
