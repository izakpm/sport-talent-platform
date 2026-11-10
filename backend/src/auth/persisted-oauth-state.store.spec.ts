import { PersistedOAuthStateStore } from './persisted-oauth-state.store';

describe('Google OAuth session persistence', () => {
  const store = new PersistedOAuthStateStore();
  it('waits for the session save before releasing the Google redirect state', () => {
    let finishSave!: (error?: Error) => void;
    const req = {
      session: {
        oauthRole: 'COACH',
        save: jest.fn((callback) => {
          finishSave = callback;
        }),
      },
    };
    const done = jest.fn();
    store.store(req as any, done);
    expect(done).not.toHaveBeenCalled();
    expect(req.session.oauthRole).toBe('COACH');
    finishSave();
    expect(done).toHaveBeenCalledWith(null, expect.any(String));
    const state = done.mock.calls[0][1];
    const verified = jest.fn();
    store.verify(req as any, state, verified);
    expect(verified).toHaveBeenCalledWith(null, true);
    const replay = jest.fn();
    store.verify(req as any, state, replay);
    expect(replay).toHaveBeenCalledWith(null, false, expect.any(Object));
  });
  it('does not redirect when saving fails', () => {
    const error = new Error('Store unavailable');
    const req = {
      session: { save: (callback: (error: Error) => void) => callback(error) },
    };
    const done = jest.fn();
    store.store(req as any, done);
    expect(done).toHaveBeenCalledWith(error, undefined);
  });
  it('still rejects missing sessions and mismatched state', () => {
    const missing = jest.fn();
    store.verify({ session: {} } as any, 'wrong-state', missing);
    expect(missing).toHaveBeenCalledWith(null, false, expect.any(Object));
    const req = { session: { save: (callback: () => void) => callback() } };
    store.store(req as any, jest.fn());
    const mismatch = jest.fn();
    store.verify(req as any, 'wrong-state', mismatch);
    expect(mismatch).toHaveBeenCalledWith(null, false, expect.any(Object));
  });
});
