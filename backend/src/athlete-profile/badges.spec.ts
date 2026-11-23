import { trainingMilestones, selectionBadges } from './badges.service';
import { entryInput } from './profile.validation';
it('validates selection levels rather than accepting arbitrary badge claims', () => {
  const body = {
    kind: 'achievement',
    title: 'Provincial team',
    date: '2026-01-01',
    achievement_type: 'team_selection',
    selection_level: 'provincial',
  };
  expect(entryInput(body).selection_level).toBe('provincial');
  expect(() =>
    entryInput({ ...body, selection_level: 'professional' }),
  ).toThrow();
  expect(() => entryInput({ ...body, achievement_type: 'general' })).toThrow();
  expect(() => entryInput({ ...body, badge_earned: true })).toThrow();
});
const interval = (start: string, hours: number) => ({
  starts_at: start,
  ends_at: new Date(Date.parse(start) + hours * 3600000).toISOString(),
});
it('counts overlapping attendance and logs only once', () => {
  const r = trainingMilestones([
    interval('2026-01-01T10:00:00Z', 2),
    interval('2026-01-01T11:00:00Z', 2),
    interval('2026-01-01T10:00:00Z', 2),
  ]);
  expect(r.verified_minutes).toBe(180);
  expect(r.remaining_minutes).toBe(420);
});
it('unlocks exact cumulative milestones and dates', () => {
  const rows = [
    interval('2026-01-01T10:00:00Z', 5),
    interval('2026-01-02T10:00:00Z', 5),
  ];
  const r = trainingMilestones(rows);
  expect(r.milestones[0]).toMatchObject({
    earned: true,
    achieved_at: '2026-01-02T15:00:00.000Z',
  });
  expect(r.next_hours).toBe(25);
});
it('ignores invalid, future and implausibly long records', () => {
  const r = trainingMilestones([
    interval('2077-01-01T10:00:00Z', 2),
    interval('2026-01-01T10:00:00Z', 25),
    { starts_at: 'bad', ends_at: 'bad' },
    interval('2026-01-01T10:00:00Z', -1),
  ]);
  expect(r.verified_minutes).toBe(0);
  expect(r.milestones.every((b) => !b.earned)).toBe(true);
});
it('requires verification and structured provincial selection; captaincy can earn a separate badge', () => {
  const entry = {
    id: 'selection',
    kind: 'achievement',
    achievement_type: 'team_selection',
    title: 'U15 Blue Bulls',
    date: '2026-06-01',
    selection_level: 'provincial',
    leadership_role: 'Captain',
    verification_status: 'pending',
  };
  expect(selectionBadges([entry])).toHaveLength(2);
  expect(selectionBadges([entry]).every((b) => !b.earned)).toBe(true);
  expect(
    selectionBadges([{ ...entry, verification_status: 'verified' }]).every(
      (b) => b.earned,
    ),
  ).toBe(true);
  expect(
    selectionBadges([
      { ...entry, selection_level: 'club', leadership_role: 'Vice-captain' },
    ]),
  ).toHaveLength(0);
  expect(
    selectionBadges([
      { ...entry, selection_level: null, leadership_role: null },
    ]),
  ).toHaveLength(0);
});
it('handles athletes past the final milestone', () => {
  const rows = Array.from({ length: 25 }, (_, i) =>
    interval(`2026-01-${String(i + 1).padStart(2, '0')}T06:00:00Z`, 10),
  );
  expect(trainingMilestones(rows)).toMatchObject({
    verified_minutes: 15000,
    next_hours: null,
    remaining_minutes: 0,
  });
});
