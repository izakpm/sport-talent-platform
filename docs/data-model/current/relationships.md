# Current foreign-key register

Each row is a database-enforced relationship. All 82 appear once across the eight detailed diagrams, in the referencing table’s group.

| Referencing table / columns | Referenced table / columns | Definition |
|---|---|---|
| activities (athlete_id) | athlete_profiles (id) | FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) |
| activities (sport_id) | sports (id) | FOREIGN KEY (sport_id) REFERENCES sports(id) |
| activities (activity_type_id) | activity_types (id) | FOREIGN KEY (activity_type_id) REFERENCES activity_types(id) |
| activity_coach_requests (activity_id) | activities (id) | FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE |
| activity_coach_requests (coach_id) | users (id) | FOREIGN KEY (coach_id) REFERENCES users(id) |
| activity_metrics (activity_id) | activities (id) | FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE |
| activity_metrics (metric_id) | metrics (id) | FOREIGN KEY (metric_id) REFERENCES metrics(id) |
| activity_verifications (activity_id) | activities (id) | FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE |
| activity_verifications (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) |
| activity_verifications (token_id) | verification_tokens (id) | FOREIGN KEY (token_id) REFERENCES verification_tokens(id) |
| activity_verifications (verified_by_user_id) | users (id) | FOREIGN KEY (verified_by_user_id) REFERENCES users(id) |
| athlete_calendar_events (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE |
| athlete_match_stats (event_id) | match_results (event_id) | FOREIGN KEY (event_id) REFERENCES match_results(event_id) ON DELETE RESTRICT |
| athlete_match_stats (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) |
| athlete_portfolio_entries (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE |
| athlete_profiles (guardian_id) | guardian_profiles (id) | FOREIGN KEY (guardian_id) REFERENCES guardian_profiles(id) |
| athlete_profiles (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) |
| athlete_resources (captions_id) | resource_assets (id) | FOREIGN KEY (captions_id) REFERENCES resource_assets(id) |
| athlete_resources (created_by) | users (id) | FOREIGN KEY (created_by) REFERENCES users(id) |
| athlete_resources (media_id) | resource_assets (id) | FOREIGN KEY (media_id) REFERENCES resource_assets(id) |
| athlete_resources (thumbnail_id) | resource_assets (id) | FOREIGN KEY (thumbnail_id) REFERENCES resource_assets(id) |
| athlete_sport_profiles (athlete_id) | athlete_profiles (id) | FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) |
| athlete_sport_profiles (sport_id) | sports (id) | FOREIGN KEY (sport_id) REFERENCES sports(id) |
| athlete_sports (athlete_id) | athlete_profiles (id) | FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) ON DELETE CASCADE |
| athlete_sports (position_id) | positions (id) | FOREIGN KEY (position_id) REFERENCES positions(id) |
| athlete_sports (sport_id) | sports (id) | FOREIGN KEY (sport_id) REFERENCES sports(id) |
| coach_player_accounts (player_id) | coach_team_players (id) | FOREIGN KEY (player_id) REFERENCES coach_team_players(id) ON DELETE CASCADE |
| coach_player_accounts (team_id) | coach_teams (id) | FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE |
| coach_player_accounts (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE |
| coach_portfolio (coach_id) | users (id) | FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE CASCADE |
| coach_profiles (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) |
| coach_schedule_events (team_id) | coach_teams (id) | FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE |
| coach_session_attendance (event_id) | coach_schedule_events (id) | FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE CASCADE |
| coach_session_attendance (player_id) | coach_team_players (id) | FOREIGN KEY (player_id) REFERENCES coach_team_players(id) ON DELETE CASCADE |
| coach_session_attendance (reviewed_by) | users (id) | FOREIGN KEY (reviewed_by) REFERENCES users(id) |
| coach_session_attendance (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) |
| coach_session_codes (event_id) | coach_schedule_events (id) | FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE CASCADE |
| coach_team_players (team_id) | coach_teams (id) | FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE |
| coach_team_posts (coach_id) | users (id) | FOREIGN KEY (coach_id) REFERENCES users(id) |
| coach_team_posts (event_id) | coach_schedule_events (id) | FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE SET NULL |
| coach_team_posts (team_id) | coach_teams (id) | FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE |
| coach_teams (coach_id) | users (id) | FOREIGN KEY (coach_id) REFERENCES users(id) |
| connections (athlete_id) | athlete_profiles (id) | FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) |
| connections (scout_id) | scout_profiles (id) | FOREIGN KEY (scout_id) REFERENCES scout_profiles(id) |
| events (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) |
| guardian_links (child_id) | users (id) | FOREIGN KEY (child_id) REFERENCES users(id) |
| guardian_links (guardian_id) | users (id) | FOREIGN KEY (guardian_id) REFERENCES users(id) |
| guardian_profiles (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) |
| match_results (event_id) | coach_schedule_events (id) | FOREIGN KEY (event_id) REFERENCES coach_schedule_events(id) ON DELETE RESTRICT |
| match_results (recorded_by) | users (id) | FOREIGN KEY (recorded_by) REFERENCES users(id) |
| opportunities (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) |
| opportunity_applications (athlete_id) | athlete_profiles (id) | FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) |
| opportunity_applications (opportunity_id) | opportunities (id) | FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) |
| organisation_affiliations (confirmed_by_user_id) | users (id) | FOREIGN KEY (confirmed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT |
| organisation_affiliations (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT |
| organisation_affiliations (requested_by_user_id) | users (id) | FOREIGN KEY (requested_by_user_id) REFERENCES users(id) ON DELETE RESTRICT |
| organisation_affiliations (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT |
| organisation_directory_sources (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) ON DELETE RESTRICT |
| organisation_users (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) |
| organisation_users (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) |
| participations (athlete_id) | athlete_profiles (id) | FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) |
| participations (event_id) | events (id) | FOREIGN KEY (event_id) REFERENCES events(id) |
| password_reset_tokens (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE |
| positions (sport_id) | sports (id) | FOREIGN KEY (sport_id) REFERENCES sports(id) |
| resource_assets (resource_id) | athlete_resources (id) | FOREIGN KEY (resource_id) REFERENCES athlete_resources(id) ON DELETE CASCADE |
| resource_publishers (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE |
| school_competition_fixtures (away_team_id) | school_competition_teams (id) | FOREIGN KEY (away_team_id) REFERENCES school_competition_teams(id) |
| school_competition_fixtures (home_team_id) | school_competition_teams (id) | FOREIGN KEY (home_team_id) REFERENCES school_competition_teams(id) |
| school_competition_profiles (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) |
| school_competition_teams (organisation_id) | school_competition_profiles (organisation_id) | FOREIGN KEY (organisation_id) REFERENCES school_competition_profiles(organisation_id) |
| scout_profiles (user_id) | users (id) | FOREIGN KEY (user_id) REFERENCES users(id) |
| team_invitations (child_id) | users (id) | FOREIGN KEY (child_id) REFERENCES users(id) |
| team_invitations (coach_id) | users (id) | FOREIGN KEY (coach_id) REFERENCES users(id) |
| team_invitations (guardian_id) | users (id) | FOREIGN KEY (guardian_id) REFERENCES users(id) |
| team_invitations (guardian_link_id) | guardian_links (id) | FOREIGN KEY (guardian_link_id) REFERENCES guardian_links(id) |
| team_invitations (team_id) | coach_teams (id) | FOREIGN KEY (team_id) REFERENCES coach_teams(id) ON DELETE CASCADE |
| verification_requests (activity_id) | activities (id) | FOREIGN KEY (activity_id) REFERENCES activities(id) |
| verification_requests (requested_by_athlete_id) | athlete_profiles (id) | FOREIGN KEY (requested_by_athlete_id) REFERENCES athlete_profiles(id) |
| verification_tokens (issued_to_user_id) | users (id) | FOREIGN KEY (issued_to_user_id) REFERENCES users(id) |
| verification_tokens (organisation_id) | organisations (id) | FOREIGN KEY (organisation_id) REFERENCES organisations(id) |
| videos (activity_id) | activities (id) | FOREIGN KEY (activity_id) REFERENCES activities(id) |
| videos (athlete_id) | athlete_profiles (id) | FOREIGN KEY (athlete_id) REFERENCES athlete_profiles(id) |
