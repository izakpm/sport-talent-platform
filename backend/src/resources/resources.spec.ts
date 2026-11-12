import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { input, uploadInput, ready } from './resources.validation';
const draft = {
  title: 'Fuel for training',
  summary: 'A practical guide',
  topic: 'nutrition',
  format: 'article',
  author: 'Sports dietitian',
  body: 'Breakfast and hydration',
  source_url: '',
  transcript: '',
  duration_minutes: 5,
};
describe('resource validation', () => {
  it('accepts articles and rejects unsafe links and invalid metadata', () => {
    expect(input(draft)).toMatchObject(draft);
    expect(() =>
      input({ ...draft, source_url: 'javascript:alert(1)' }),
    ).toThrow();
    expect(() => input({ ...draft, duration_minutes: 0 })).toThrow();
    expect(() => input({ ...draft, topic: 'unknown' })).toThrow();
  });
  it('requires usable content and checks media format before publishing', () => {
    expect(() => ready(draft)).not.toThrow();
    expect(() => ready({ ...draft, body: '' })).toThrow();
    expect(() =>
      ready({ ...draft, format: 'audio', media_id: 'file' }, 'video/mp4'),
    ).toThrow();
    expect(() =>
      ready({
        ...draft,
        format: 'video',
        source_url: 'https://youtu.be/abcdefghijk',
      }),
    ).not.toThrow();
  });
  it('restricts uploads by purpose, format and size', () => {
    expect(
      uploadInput(
        { purpose: 'media', mime: 'video/mp4', size: 100, name: 'video.mp4' },
        'video',
      ),
    ).toMatchObject({ mime: 'video/mp4' });
    expect(() =>
      uploadInput(
        {
          purpose: 'thumbnail',
          mime: 'image/svg+xml',
          size: 100,
          name: 'x.svg',
        },
        'video',
      ),
    ).toThrow();
    expect(() =>
      uploadInput(
        {
          purpose: 'media',
          mime: 'video/mp4',
          size: 51 * 1024 * 1024,
          name: 'x.mp4',
        },
        'video',
      ),
    ).toThrow();
    expect(() =>
      uploadInput(
        { purpose: 'media', mime: 'video/mp4', size: 100, name: 'x.mp4' },
        'article',
      ),
    ).toThrow();
  });
});
describe('resource permissions and publishing', () => {
  const db = { query: jest.fn(), transaction: jest.fn() };
  let service: ResourcesService;
  beforeEach(() => {
    jest.resetAllMocks();
    service = new ResourcesService(db as any);
    db.transaction.mockImplementation((fn) => fn(db));
  });
  it('rejects all admin operations for an ordinary athlete before writing or issuing URLs', async () => {
    db.query.mockResolvedValue([
      { role: 'ATHLETE', publisher: false, status: 'ACTIVE' },
    ]);
    for (const operation of [
      () => service.save('athlete', draft),
      () => service.upload('athlete', 'resource', {}),
      () => service.complete('athlete', 'resource', 'file', 1),
      () => service.transition('athlete', 'resource', { action: 'publish' }),
      () => service.detach('athlete', 'resource', 'media', 1),
    ])
      await expect(operation()).rejects.toBeInstanceOf(ForbiddenException);
    expect(db.transaction).not.toHaveBeenCalled();
  });
  it('does not treat a claimed ADMIN role as publishing permission', async () => {
    db.query.mockResolvedValue([{ role: 'ADMIN', publisher: false }]);
    await expect(service.access('u', true)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('lets parents read published resources without granting publishing permission', async () => {
    db.query.mockResolvedValue([
      { role: 'GUARDIAN', publisher: false, status: 'ACTIVE' },
    ]);
    await expect(service.access('parent')).resolves.toMatchObject({
      role: 'GUARDIAN',
    });
    await expect(service.access('parent', true)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('denies suspended publishers', async () => {
    db.query.mockResolvedValue([
      { role: 'COACH', publisher: true, status: 'SUSPENDED' },
    ]);
    await expect(service.access('u', true)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
  it('never returns a draft on the athlete detail endpoint', async () => {
    db.query
      .mockResolvedValueOnce([{ role: 'ATHLETE', publisher: false }])
      .mockResolvedValueOnce([]);
    await expect(service.detail('u', 'draft')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(db.query.mock.calls[1][0]).toContain("AND status='published'");
  });
  it('uses published-only SQL and parameterized search for athlete browsing', async () => {
    db.query.mockImplementation(async (sql: string) =>
      sql.includes('SELECT u.role')
        ? [{ role: 'ATHLETE', publisher: false }]
        : sql.includes('count(*)')
          ? [{ total: 0 }]
          : [],
    );
    expect(
      await service.list('u', { search: "' OR 1=1 --", topic: 'nutrition' }),
    ).toMatchObject({ items: [], total: 0 });
    const call = db.query.mock.calls.find(([sql]) => sql.includes('LIMIT 12'));
    expect(call[1]).toEqual(['published', "' OR 1=1 --", 'nutrition', '', 0]);
  });
  it('requires uploaded storage metadata before accepting an asset', async () => {
    db.query
      .mockResolvedValueOnce([{ publisher: true, role: 'COACH' }])
      .mockResolvedValueOnce([
        { id: 'a', size: 100, mime: 'video/mp4', path: 'r/a' },
      ])
      .mockResolvedValueOnce([]);
    await expect(service.complete('u', 'r', 'a', 1)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(db.transaction).not.toHaveBeenCalled();
  });
  it('rejects stale publishing changes', async () => {
    db.query
      .mockResolvedValueOnce([{ publisher: true, role: 'COACH' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...draft, version: 2, status: 'draft' }]);
    await expect(
      service.transition('u', 'r', { action: 'publish', version: 1 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('clears the previous feature inside the publishing transaction', async () => {
    db.query
      .mockResolvedValueOnce([{ publisher: true, role: 'COACH' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { ...draft, version: 1, status: 'published', featured: false },
      ])
      .mockResolvedValue([]);
    jest
      .spyOn(service, 'detail')
      .mockResolvedValue({ id: 'r', featured: true });
    await service.transition('u', 'r', { action: 'feature', version: 1 });
    expect(db.transaction).toHaveBeenCalled();
    expect(
      db.query.mock.calls.some(([sql]) => sql.includes('SET featured=false')),
    ).toBe(true);
  });
});
