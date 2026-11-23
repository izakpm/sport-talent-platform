CREATE TABLE IF NOT EXISTS personal_session_invitations (
  event_id uuid PRIMARY KEY REFERENCES athlete_calendar_events(id) ON DELETE CASCADE,
  invitee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  CHECK ((status='pending') = (responded_at IS NULL))
);
CREATE INDEX IF NOT EXISTS personal_session_invitations_recipient ON personal_session_invitations(invitee_id,status);
ALTER TABLE personal_session_invitations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON personal_session_invitations FROM anon, authenticated;
