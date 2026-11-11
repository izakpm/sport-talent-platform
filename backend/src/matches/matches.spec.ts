import { matchInput } from './matches.service';
describe('match input', () => {
  it('accepts zero scores and draws', () =>
    expect(
      matchInput({ opponent: ' North ', team_score: 0, opponent_score: 0 }),
    ).toEqual({ opponent: 'North', team_score: 0, opponent_score: 0 }));
  it.each([-1, 1.5, 1000, '12', null])('rejects invalid scores %p', (score) =>
    expect(() =>
      matchInput({ opponent: 'North', team_score: score, opponent_score: 0 }),
    ).toThrow(),
  );
  it('rejects forged ownership', () =>
    expect(() =>
      matchInput({
        opponent: 'North',
        team_score: 0,
        opponent_score: 0,
        user_id: 'someone',
      }),
    ).toThrow());
  it('keeps blank stats distinct from zero', () =>
    expect(matchInput({ tries: 0 }, true)).toMatchObject({
      tries: 0,
      minutes: null,
    }));
  it.each([
    'javascript:alert(1)',
    'data:text/html,x',
    'https://user:pass@example.com',
    'invalid',
  ])('rejects unsafe video %s', (url) =>
    expect(() => matchInput({ video_url: url }, true)).toThrow(),
  );
  it('allows video links and trims position', () =>
    expect(
      matchInput(
        { video_url: 'https://youtu.be/test', position: ' Eighth man ' },
        true,
      ),
    ).toMatchObject({ position: 'Eighth man' }));
});
