import {
  achievementDecisionInput,
  achievementRequestInput,
} from './achievement-verification.service';
import { AthleteProfileService } from './profile.service';
const coach = '22222222-2222-2222-2222-222222222222';
it('accepts a linked-coach request payload and trims the message', () =>
  expect(
    achievementRequestInput({ coach_id: coach, note: ' Confirm selection ' }),
  ).toEqual({ coach_id: coach, note: 'Confirm selection' }));
it.each([
  {},
  null,
  [],
  { coach_id: 'bad' },
  { coach_id: coach, status: 'verified' },
  { coach_id: coach, note: 'x'.repeat(1001) },
])('rejects invalid or privileged requests %j', (body) =>
  expect(() => achievementRequestInput(body)).toThrow(),
);
it('requires actionable feedback when declining', () => {
  expect(() =>
    achievementDecisionInput({ status: 'declined', note: ' ' }),
  ).toThrow();
  expect(
    achievementDecisionInput({
      status: 'declined',
      note: 'Check the selection date',
    }),
  ).toEqual({ status: 'declined', note: 'Check the selection date' });
});
it.each([
  { status: 'pending' },
  { status: 'verified', coach_id: coach },
  { status: 'verified', note: 42 },
])('rejects invalid review payloads %j', (body) =>
  expect(() => achievementDecisionInput(body)).toThrow(),
);
it.each(['pending', 'verified'])(
  'locks %s records before editing or deletion',
  async (status) => {
    const service = new AthleteProfileService({} as any);
    await expect(
      service.editable({ query: async () => [{ status }] }, 'entry'),
    ).rejects.toThrow();
  },
);
it('allows correction of a declined record', async () => {
  const service = new AthleteProfileService({} as any);
  await expect(
    service.editable({ query: async () => [{ status: 'declined' }] }, 'entry'),
  ).resolves.toBeUndefined();
});
