import {
  certificateInput,
  portfolioInput,
  PortfolioService,
} from './portfolio.service';
describe('Coach portfolio', () => {
  const base = { title: 'Level 1', start_date: '1998-02-01' };
  it('accepts historical coaching dates and current roles', () =>
    expect(
      portfolioInput('history', { ...base, role: 'Head coach' })[5],
    ).toBeNull());
  it('rejects invalid and reversed dates', () => {
    expect(() =>
      portfolioInput('qualifications', { ...base, end_date: '1997-01-01' }),
    ).toThrow();
    expect(() =>
      portfolioInput('achievements', { ...base, start_date: '2025-02-30' }),
    ).toThrow();
  });
  it('requires coaching role and rejects arbitrary sections', () => {
    expect(() => portfolioInput('history', base)).toThrow();
    expect(() => portfolioInput('other', base)).toThrow();
  });
  it('validates file content instead of trusting its extension', () => {
    expect(() =>
      certificateInput({
        name: 'file.pdf',
        data: Buffer.from('<script>alert(1)</script>').toString('base64'),
      }),
    ).toThrow();
    expect(
      certificateInput({
        name: 'proof.pdf',
        data: Buffer.from('%PDF-1.4 test').toString('base64'),
      }).mime,
    ).toBe('application/pdf');
  });
  it('rejects oversized certificates', () =>
    expect(() =>
      certificateInput({
        name: 'big.pdf',
        data: Buffer.alloc(2097153).toString('base64'),
      }),
    ).toThrow());
  it('denies non-coaches and suspended users', async () => {
    for (const user of [
      { role: 'ATHLETE' },
      { role: 'COACH', status: 'SUSPENDED' },
    ]) {
      const db = { query: jest.fn().mockResolvedValue([user]) };
      await expect(
        new PortfolioService(db as any).list('owner', 'history'),
      ).rejects.toThrow('A coach account');
      expect(db.query).toHaveBeenCalledTimes(1);
    }
  });
  it('scopes certificate downloads and deletion to the authenticated owner', async () => {
    const db = {
      query: jest
        .fn()
        .mockResolvedValueOnce([{ role: 'COACH' }])
        .mockResolvedValueOnce([]),
    };
    await expect(
      new PortfolioService(db as any).certificate('owner', 'foreign'),
    ).rejects.toThrow('Certificate not found');
    expect(db.query.mock.calls[1][1]).toEqual(['foreign', 'owner']);
    db.query
      .mockResolvedValueOnce([{ role: 'COACH' }])
      .mockResolvedValueOnce([]);
    await expect(
      new PortfolioService(db as any).remove('owner', 'foreign'),
    ).rejects.toThrow('Record not found');
    expect(db.query.mock.calls[3][1]).toEqual(['foreign', 'owner']);
  });
  it('rolls back when editing a record owned by another coach', async () => {
    const tx = { query: jest.fn().mockResolvedValue([]) };
    const db = {
      query: jest.fn().mockResolvedValue([{ role: 'COACH' }]),
      transaction: async (fn: any) => fn(tx),
    };
    await expect(
      new PortfolioService(db as any).save(
        'owner',
        'achievements',
        base,
        'foreign',
      ),
    ).rejects.toThrow('Record not found');
    expect(tx.query.mock.calls[0][1]).toEqual(
      expect.arrayContaining(['owner', 'achievements', 'foreign']),
    );
  });
});
