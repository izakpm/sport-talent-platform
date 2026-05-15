# Database Schema

## activities
| column_name      | data_type                   | is_nullable |
| ---------------- | --------------------------- | ----------- |
| id               | uuid                        | NO          |
| athlete_id       | uuid                        | YES         |
| type             | text                        | YES         |
| sport_id         | uuid                        | YES         |
| title            | text                        | YES         |
| description      | text                        | YES         |
| start_time       | timestamp without time zone | YES         |
| end_time         | timestamp without time zone | YES         |
| duration_minutes | integer                     | YES         |
| location         | text                        | YES         |
| created_at       | timestamp without time zone | YES         |

## activity_metrics
| column_name | data_type | is_nullable |
| ----------- | --------- | ----------- |
| id          | uuid      | NO          |
| activity_id | uuid      | YES         |
| metric_id   | uuid      | YES         |
| value       | numeric   | YES         |
| unit        | text      | YES         |

## activity_verifications
| column_name         | data_type                   | is_nullable |
| ------------------- | --------------------------- | ----------- |
| id                  | uuid                        | NO          |
| activity_id         | uuid                        | YES         |
| method              | text                        | YES         |
| verification_level  | text                        | YES         |
| verified_by_user_id | uuid                        | YES         |
| organisation_id     | uuid                        | YES         |
| token_id            | uuid                        | YES         |
| confidence_score    | numeric                     | YES         |
| status              | text                        | YES         |
| verified_at         | timestamp without time zone | YES         |

## athlete_profiles
| column_name        | data_type | is_nullable |
| ------------------ | --------- | ----------- |
| id                 | uuid      | NO          |
| user_id            | uuid      | YES         |
| first_name         | text      | YES         |
| last_name          | text      | YES         |
| date_of_birth      | date      | YES         |
| gender             | text      | YES         |
| nationality        | text      | YES         |
| province           | text      | YES         |
| school_id          | uuid      | YES         |
| guardian_id        | uuid      | YES         |
| profile_visibility | text      | YES         |

## athlete_sport_positions
| column_name | data_type | is_nullable |
| ----------- | --------- | ----------- |
| id          | uuid      | NO          |
| athlete_id  | uuid      | YES         |
| sport_id    | uuid      | YES         |
| position_id | uuid      | YES         |
| is_primary  | boolean   | YES         |

## athlete_sport_profiles
| column_name      | data_type | is_nullable |
| ---------------- | --------- | ----------- |
| id               | uuid      | NO          |
| athlete_id       | uuid      | YES         |
| sport_id         | uuid      | YES         |
| primary_sport    | boolean   | YES         |
| position         | text      | YES         |
| level            | text      | YES         |
| years_experience | integer   | YES         |

## athlete_sports
| column_name | data_type | is_nullable |
| ----------- | --------- | ----------- |
| id          | uuid      | NO          |
| athlete_id  | uuid      | YES         |
| sport_id    | uuid      | YES         |
| position_id | uuid      | YES         |
| is_primary  | boolean   | YES         |

## coach_profiles
| column_name         | data_type | is_nullable |
| ------------------- | --------- | ----------- |
| id                  | uuid      | NO          |
| user_id             | uuid      | YES         |
| organisation_id     | uuid      | YES         |
| sport_id            | uuid      | YES         |
| verification_status | text      | YES         |
| full_name           | text      | YES         |
| phone               | text      | YES         |
| years_experience    | integer   | YES         |
| primary_sport       | text      | YES         |
| coaching_level      | text      | YES         |
| certifications      | text      | YES         |
| previous_teams      | text      | YES         |
| achievements        | text      | YES         |
| location            | text      | YES         |

## connections
| column_name | data_type                   | is_nullable |
| ----------- | --------------------------- | ----------- |
| id          | uuid                        | NO          |
| athlete_id  | uuid                        | YES         |
| scout_id    | uuid                        | YES         |
| type        | text                        | YES         |
| status      | text                        | YES         |
| created_at  | timestamp without time zone | YES         |

## events
| column_name     | data_type | is_nullable |
| --------------- | --------- | ----------- |
| id              | uuid      | NO          |
| organisation_id | uuid      | YES         |
| name            | text      | YES         |
| type            | text      | YES         |
| location        | text      | YES         |
| start_date      | date      | YES         |
| end_date        | date      | YES         |

## guardian_profiles
| column_name       | data_type                   | is_nullable |
| ----------------- | --------------------------- | ----------- |
| id                | uuid                        | NO          |
| user_id           | uuid                        | YES         |
| name              | text                        | YES         |
| phone             | text                        | YES         |
| relationship      | text                        | YES         |
| consent_status    | text                        | YES         |
| consent_timestamp | timestamp without time zone | YES         |

## metrics
| column_name    | data_type | is_nullable |
| -------------- | --------- | ----------- |
| id             | uuid      | NO          |
| name           | text      | YES         |
| unit           | text      | YES         |
| category       | text      | YES         |
| sport_id       | uuid      | YES         |
| is_time_series | boolean   | YES         |

## opportunities
| column_name     | data_type | is_nullable |
| --------------- | --------- | ----------- |
| id              | uuid      | NO          |
| organisation_id | uuid      | YES         |
| title           | text      | YES         |
| description     | text      | YES         |
| sport_id        | uuid      | YES         |
| age_range       | text      | YES         |
| location        | text      | YES         |
| start_date      | date      | YES         |
| end_date        | date      | YES         |
| status          | text      | YES         |

## opportunity_applications
| column_name    | data_type                   | is_nullable |
| -------------- | --------------------------- | ----------- |
| id             | uuid                        | NO          |
| opportunity_id | uuid                        | YES         |
| athlete_id     | uuid                        | YES         |
| status         | text                        | YES         |
| scout_notes    | text                        | YES         |
| created_at     | timestamp without time zone | YES         |

## organisation_users
| column_name     | data_type | is_nullable |
| --------------- | --------- | ----------- |
| id              | uuid      | NO          |
| user_id         | uuid      | YES         |
| organisation_id | uuid      | YES         |
| role            | text      | YES         |

## organisations
| column_name         | data_type                   | is_nullable |
| ------------------- | --------------------------- | ----------- |
| id                  | uuid                        | NO          |
| name                | text                        | YES         |
| type                | text                        | YES         |
| location            | text                        | YES         |
| verification_status | text                        | YES         |
| created_at          | timestamp without time zone | YES         |
| contact_person      | text                        | YES         |
| email               | text                        | YES         |
| phone               | text                        | YES         |

## participations
| column_name    | data_type | is_nullable |
| -------------- | --------- | ----------- |
| id             | uuid      | NO          |
| athlete_id     | uuid      | YES         |
| event_id       | uuid      | YES         |
| position       | text      | YES         |
| minutes_played | integer   | YES         |
| stats_json     | jsonb     | YES         |
| self_reported  | boolean   | YES         |
| verified       | boolean   | YES         |

## positions
| column_name | data_type | is_nullable |
| ----------- | --------- | ----------- |
| id          | uuid      | NO          |
| sport_id    | uuid      | YES         |
| name        | text      | YES         |

## scout_profiles
| column_name         | data_type | is_nullable |
| ------------------- | --------- | ----------- |
| id                  | uuid      | NO          |
| user_id             | uuid      | YES         |
| organisation_id     | uuid      | YES         |
| sport_id            | uuid      | YES         |
| regions_of_interest | text      | YES         |
| verification_status | text      | YES         |
| full_name           | text      | YES         |
| organisation_name   | text      | YES         |
| sports_of_interest  | text      | YES         |

## sports
| column_name | data_type | is_nullable |
| ----------- | --------- | ----------- |
| id          | uuid      | NO          |
| name        | text      | YES         |
| category    | text      | YES         |

## users
| column_name                 | data_type                   | is_nullable |
| --------------------------- | --------------------------- | ----------- |
| id                          | uuid                        | NO          |
| email                       | text                        | NO          |
| password_hash               | text                        | NO          |
| role                        | text                        | YES         |
| status                      | text                        | YES         |
| created_at                  | timestamp without time zone | YES         |
| last_login                  | timestamp without time zone | YES         |
| first_name                  | text                        | YES         |
| last_name                   | text                        | YES         |
| phone                       | text                        | YES         |
| instance_id                 | uuid                        | YES         |
| id                          | uuid                        | NO          |
| aud                         | character varying           | YES         |
| role                        | character varying           | YES         |
| email                       | character varying           | YES         |
| encrypted_password          | character varying           | YES         |
| email_confirmed_at          | timestamp with time zone    | YES         |
| invited_at                  | timestamp with time zone    | YES         |
| confirmation_token          | character varying           | YES         |
| confirmation_sent_at        | timestamp with time zone    | YES         |
| recovery_token              | character varying           | YES         |
| recovery_sent_at            | timestamp with time zone    | YES         |
| email_change_token_new      | character varying           | YES         |
| email_change                | character varying           | YES         |
| email_change_sent_at        | timestamp with time zone    | YES         |
| last_sign_in_at             | timestamp with time zone    | YES         |
| raw_app_meta_data           | jsonb                       | YES         |
| raw_user_meta_data          | jsonb                       | YES         |
| is_super_admin              | boolean                     | YES         |
| created_at                  | timestamp with time zone    | YES         |
| updated_at                  | timestamp with time zone    | YES         |
| phone                       | text                        | YES         |
| phone_confirmed_at          | timestamp with time zone    | YES         |
| phone_change                | text                        | YES         |
| phone_change_token          | character varying           | YES         |
| phone_change_sent_at        | timestamp with time zone    | YES         |
| confirmed_at                | timestamp with time zone    | YES         |
| email_change_token_current  | character varying           | YES         |
| email_change_confirm_status | smallint                    | YES         |
| banned_until                | timestamp with time zone    | YES         |
| reauthentication_token      | character varying           | YES         |
| reauthentication_sent_at    | timestamp with time zone    | YES         |
| is_sso_user                 | boolean                     | NO          |
| deleted_at                  | timestamp with time zone    | YES         |
| is_anonymous                | boolean                     | NO          |

## verification_requests
| column_name             | data_type                   | is_nullable |
| ----------------------- | --------------------------- | ----------- |
| id                      | uuid                        | NO          |
| activity_id             | uuid                        | YES         |
| requested_by_athlete_id | uuid                        | YES         |
| coach_id                | uuid                        | YES         |
| message                 | text                        | YES         |
| status                  | text                        | YES         |
| responded_at            | timestamp without time zone | YES         |
| athlete_id              | uuid                        | YES         |

## verification_tokens
| column_name       | data_type                   | is_nullable |
| ----------------- | --------------------------- | ----------- |
| id                | uuid                        | NO          |
| code              | text                        | YES         |
| issued_to_user_id | uuid                        | YES         |
| organisation_id   | uuid                        | YES         |
| type              | text                        | YES         |
| expires_at        | timestamp without time zone | YES         |
| usage_limit       | integer                     | YES         |
| created_at        | timestamp without time zone | YES         |

## videos
| column_name   | data_type                   | is_nullable |
| ------------- | --------------------------- | ----------- |
| id            | uuid                        | NO          |
| athlete_id    | uuid                        | YES         |
| activity_id   | uuid                        | YES         |
| event_id      | uuid                        | YES         |
| title         | text                        | YES         |
| description   | text                        | YES         |
| url           | text                        | YES         |
| thumbnail_url | text                        | YES         |
| duration      | integer                     | YES         |
| visibility    | text                        | YES         |
| upload_date   | timestamp without time zone | YES         |