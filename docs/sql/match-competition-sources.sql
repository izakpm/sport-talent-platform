-- Additive metadata for researched results and competition branding.
BEGIN;
ALTER TABLE public.coach_schedule_events
  ADD COLUMN IF NOT EXISTS competition_code varchar(60),
  ADD COLUMN IF NOT EXISTS competition_label varchar(160);
ALTER TABLE public.match_results
  ADD COLUMN IF NOT EXISTS source_label varchar(120),
  ADD COLUMN IF NOT EXISTS source_url varchar(2000),
  ADD COLUMN IF NOT EXISTS outcome_override varchar(4) CHECK (outcome_override IN ('Win', 'Loss')),
  ADD COLUMN IF NOT EXISTS decision_note varchar(300);
COMMIT;
