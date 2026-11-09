/** @jest-environment node */

describe('Vercel API routing', () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.BACKEND_URL;
    delete process.env.NEXT_PUBLIC_API_URL;
    delete process.env.VERCEL;
  });
  afterEach(() => { process.env = originalEnv; });

  it('routes API requests to the configured backend without swallowing product pages', async () => {
    process.env.VERCEL = '1';
    process.env.BACKEND_URL = 'https://api.example.com/';
    const config = (await import('./next.config')).default;
    const rewrites = await config.rewrites!();
    expect(rewrites).toContainEqual({ source: '/api/:path*', destination: 'https://api.example.com/:path*' });
    expect(rewrites).not.toContainEqual(expect.objectContaining({ source: '/:path*' }));
    expect((await import('./app/lib/api')).API_URL).toBe('/api');
  });

  it('fails the Vercel build when no backend is configured', async () => {
    process.env.VERCEL = '1';
    await expect(import('./next.config')).rejects.toThrow('BACKEND_URL');
  });

  it.each(['http://localhost:3001', 'https://api.example.com/path', 'https://user:pass@api.example.com'])('rejects invalid deployment origin %s', async (origin) => {
    process.env.VERCEL = '1';
    process.env.BACKEND_URL = origin;
    await expect(import('./next.config')).rejects.toThrow('BACKEND_URL');
  });
});
