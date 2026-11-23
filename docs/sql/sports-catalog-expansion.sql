-- Add selectable sports and their positions/disciplines without changing profiles.
-- Safe to rerun: existing catalogue IDs and names are preserved.
BEGIN;
LOCK TABLE sports, positions IN SHARE ROW EXCLUSIVE MODE;

INSERT INTO sports (name, category)
SELECT name, category FROM (VALUES
  ('Hockey', 'Team Sport'),
  ('Athletics', 'Individual Sport'),
  ('Golf', 'Individual Sport'),
  ('Mountain Biking', 'Individual Sport'),
  ('Cricket', 'Team Sport')
) AS additions(name, category)
WHERE NOT EXISTS (SELECT 1 FROM sports s WHERE lower(trim(s.name))=lower(additions.name));

INSERT INTO positions (sport_id, name)
SELECT s.id, additions.name FROM (VALUES
  ('Hockey', 'Goalkeeper'), ('Hockey', 'Defender'),
  ('Hockey', 'Midfielder'), ('Hockey', 'Forward'),
  ('Athletics', '100 m'), ('Athletics', '200 m'), ('Athletics', '400 m'),
  ('Athletics', '800 m'), ('Athletics', '1,500 m'), ('Athletics', '3,000 m'),
  ('Athletics', '5,000 m'), ('Athletics', '10,000 m'),
  ('Athletics', 'Hurdles'), ('Athletics', 'Relays'),
  ('Athletics', 'High jump'), ('Athletics', 'Long jump'),
  ('Athletics', 'Triple jump'), ('Athletics', 'Pole vault'),
  ('Athletics', 'Shot put'), ('Athletics', 'Discus'),
  ('Athletics', 'Javelin'), ('Athletics', 'Hammer throw'),
  ('Athletics', 'Cross-country'), ('Athletics', 'Road running'),
  ('Athletics', 'Combined events'),
  ('Golf', 'Golfer'),
  ('Mountain Biking', 'Cross-country'), ('Mountain Biking', 'Marathon'),
  ('Mountain Biking', 'Downhill'), ('Mountain Biking', 'Enduro'),
  ('Mountain Biking', 'Trail riding'),
  ('Cricket', 'Batter'), ('Cricket', 'Fast bowler'),
  ('Cricket', 'Spin bowler'), ('Cricket', 'All-rounder'),
  ('Cricket', 'Wicketkeeper')
) AS additions(sport, name)
JOIN sports s ON lower(trim(s.name))=lower(additions.sport)
WHERE NOT EXISTS (SELECT 1 FROM positions p WHERE p.sport_id=s.id AND lower(trim(p.name))=lower(additions.name));
COMMIT;
