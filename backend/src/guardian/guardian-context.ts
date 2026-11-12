import { ForbiddenException } from '@nestjs/common';
import { DataSource } from 'typeorm';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Delegation is restricted to athlete features, never account/auth/admin endpoints.
export async function guardianContext(db: DataSource, req: any, payload: any) {
  const child = req.headers?.['x-athlete-id'];
  if (!child && payload.role === 'GUARDIAN') {
    const path = (req.path || '').replace(/^\/api(?=\/)/, '');
    if (
      !path.startsWith('/guardian/') &&
      path !== '/auth/me' &&
      path !== `/users/${payload.sub}` &&
      path !== '/resources/capabilities'
    )
      throw new ForbiddenException(
        'Select a linked child before opening athlete features.',
      );
  }
  if (!child)
    return { userId: payload.sub, email: payload.email, role: payload.role };
  if (
    payload.role !== 'GUARDIAN' ||
    typeof child !== 'string' ||
    !uuid.test(child)
  )
    throw new ForbiddenException('Invalid child context.');
  const path = (req.path || '').replace(/^\/api(?=\/)/, '');
  const readable =
    /^\/(athlete-profile(?:\/|$)|activities(?:\/|$)|team-hub\/(?:teams|feed|calendar|sessions|summary|connections|matches|check-in)(?:\/|$)|resources(?:\/|$))/;
  if (!readable.test(path) && !path.startsWith('/team-hub/personal-sessions'))
    throw new ForbiddenException(
      'This feature is not available in a child workspace.',
    );
  const [link] = await db.query(
    `SELECT l.mode FROM guardian_links l JOIN users p ON p.id=l.guardian_id JOIN users c ON c.id=l.child_id WHERE l.guardian_id=$1 AND l.child_id=$2 AND l.status='accepted' AND p.role='GUARDIAN' AND c.role='ATHLETE' AND p.status IS DISTINCT FROM 'SUSPENDED' AND c.status IS DISTINCT FROM 'SUSPENDED'`,
    [payload.sub, child],
  );
  if (!link)
    throw new ForbiddenException(
      'This child is not linked, or access has been removed.',
    );
  if (
    link.mode === 'view' &&
    !/^\/(?:athlete-profile|team-hub\/(?:teams|feed|calendar|matches))$/.test(
      path,
    )
  )
    throw new ForbiddenException(
      'This information is outside the approved parent link.',
    );
  if (!['GET', 'HEAD'].includes(req.method)) {
    if (link.mode !== 'managed')
      throw new ForbiddenException('Linked athlete accounts are read-only.');
    const writable =
      /^\/(?:athlete-profile(?:\/|$)|activities(?:\/|$)|team-hub\/(?:check-in(?:\/preview)?$|personal-sessions(?:\/|$)|sessions\/[0-9a-f-]+\/request$|matches\/[0-9a-f-]+\/stats$))/i;
    if (!writable.test(path))
      throw new ForbiddenException(
        'Parents cannot perform this action for an athlete.',
      );
  }
  return {
    userId: child,
    role: 'ATHLETE',
    actorId: payload.sub,
    guardianMode: link.mode,
  };
}
