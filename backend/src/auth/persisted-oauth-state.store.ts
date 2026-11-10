import type { Request } from 'express';

// Keep Passport's state generation and validation, but commit the new session
// before allowing Passport to send its redirect to Google.
const SessionStateStore =
  require('passport-oauth2/lib/state/session') as new (options: {
    key: string;
  }) => {
    store(
      req: Request,
      callback: (error: Error | null, state?: string) => void,
    ): void;
    verify(
      req: Request,
      state: string,
      callback: (...args: any[]) => void,
    ): void;
  };

export class PersistedOAuthStateStore {
  private readonly delegate = new SessionStateStore({
    key: 'oauth2:accounts.google.com',
  });

  store(req: Request, callback: (error: Error | null, state?: string) => void) {
    this.delegate.store(req, (error, state) => {
      if (error) return callback(error);
      req.session.save((saveError) =>
        callback(saveError || null, saveError ? undefined : state),
      );
    });
  }

  verify(req: Request, state: string, callback: (...args: any[]) => void) {
    this.delegate.verify(req, state, callback);
  }
}
