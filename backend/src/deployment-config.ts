export function deploymentConfig(env: NodeJS.ProcessEnv = process.env) {
  const production = env.NODE_ENV === 'production' || env.VERCEL === '1';
  const secret = (key: string) => {
    const value = env[key];
    if (production && (!value || value.length < 32)) {
      throw new Error(`${key} must contain at least 32 characters in production.`);
    }
    return value || `local-development-only-${key}`;
  };
  const jwtSecret = secret('JWT_SECRET');
  const sessionSecret = secret('SESSION_SECRET');
  const frontendUrl = env.FRONTEND_URL || (production ? '' : 'http://localhost:3000');
  let origin: URL;
  try {
    origin = new URL(frontendUrl);
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash ||
      (production && (origin.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)))) {
      throw new Error();
    }
  } catch {
    throw new Error('FRONTEND_URL must be a valid origin (public HTTPS in production).');
  }
  return { production, jwtSecret, sessionSecret, frontendUrl: origin.origin };
}
