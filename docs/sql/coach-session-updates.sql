BEGIN;
ALTER TABLE coach_team_posts DROP CONSTRAINT IF EXISTS coach_team_posts_category_check;
ALTER TABLE coach_team_posts ADD CONSTRAINT coach_team_posts_category_check CHECK(category IN ('announcement','reminder','session_update','cancellation'));
COMMIT;
