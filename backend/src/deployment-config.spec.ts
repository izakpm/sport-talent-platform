import { deploymentConfig } from './deployment-config';

describe('deployment configuration', () => {
  it('keeps local development defaults', () => {
    expect(deploymentConfig({}).frontendUrl).toBe('http://localhost:3000');
  });

  it('rejects missing production secrets', () => {
    expect(() => deploymentConfig({ NODE_ENV: 'production' })).toThrow('JWT_SECRET');
  });

  it('requires an HTTPS frontend in production', () => {
    expect(() => deploymentConfig({
      NODE_ENV: 'production', JWT_SECRET: 'j'.repeat(32), SESSION_SECRET: 's'.repeat(32),
      FRONTEND_URL: 'http://localhost:3000',
    })).toThrow('FRONTEND_URL');
  });

  it('normalizes the production frontend and retains private secrets', () => {
    const config = deploymentConfig({
      VERCEL: '1', JWT_SECRET: 'j'.repeat(32), SESSION_SECRET: 's'.repeat(32),
      FRONTEND_URL: 'https://playverified.example/',
    });
    expect(config.frontendUrl).toBe('https://playverified.example');
    expect(config.production).toBe(true);
  });
});
