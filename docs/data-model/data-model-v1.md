📘 Sport Talent Management Platform
Data Model Document v1.0
Version: 1.0
Date: May 2026
Author: System Design Draft
Status: Initial Baseline

1. 🧭 Overview
The Sport Talent Management Platform is designed to:

Capture and track athlete profiles
Record activities (training, matches, gym sessions)
Maintain verified performance data
Enable scouting, recruitment, and talent discovery
Provide a trusted dataset for coaches, scouts, and institutions

The system is built around activities and verification, forming a credible performance history for each athlete.

2. 🧱 Core Design Principles


Activity-Centric Architecture
All performance data originates from activities.


Time-Series Data Model
Metrics and performance evolve over time.


Multi-Layer Verification System
All data carries a trust level based on verification type.


Role-Based User Model
Supports Athletes, Guardians, Coaches, Scouts, and Organisations.


Extensibility Across Sports
Sport-agnostic core with sport-specific extensions.


Trust as a First-Class Concept
Verification and reputation are embedded into the data model.



3. 👤 User & Identity Model

3.1 Entity: User
Description:
Authentication and account-level information.
Fields:
id (UUID)
email (string)
password_hash (string)
role (enum: ATHLETE, GUARDIAN, COACH, SCOUT, ADMIN)
status (enum: ACTIVE, PENDING, SUSPENDED)
created_at (timestamp)
last_login (timestamp)


3.2 Entity: AthleteProfile
Description:
Represents an athlete.
Fields:
id (UUID)
user_id (FK → User)
first_name
last_name
date_of_birth
gender
nationality
province
school_id (FK → Organisation)
guardian_id (FK → GuardianProfile)
profile_visibility (PRIVATE / LIMITED / PUBLIC)
created_at


3.3 Entity: GuardianProfile
id
user_id
name
phone
relationship
consent_status (PENDING / APPROVED)
consent_timestamp


3.4 Entity: CoachProfile
id
user_id
organisation_id
sport_id
verification_status


3.5 Entity: ScoutProfile
id
user_id
organisation_id
sport_id
regions_of_interest
verification_status


4. 🏫 Organisation Model

4.1 Entity: Organisation
id
name
type (SCHOOL, CLUB, ACADEMY, UNIVERSITY, PRO_TEAM)
location
verification_status
created_at


4.2 Entity: OrganisationUser
id
user_id
organisation_id
role (COACH, SCOUT, ADMIN, ANALYST)


5. 🏅 Sport & Participation

5.1 Entity: Sport
id
name
category


5.2 Entity: AthleteSportProfile
id
athlete_id
sport_id
primary (boolean)
position
level (SCHOOL, CLUB, PROVINCIAL)
years_experience


6. 📊 Activity & Performance Model (CORE SYSTEM)

6.1 Entity: Activity
Description:
Represents any athlete-performed action.
id
athlete_id (FK)
type (GYM, PRACTICE, MATCH, CONDITIONING, TRIAL)
sport_id
title
description
start_time
end_time
duration_minutes
location
created_at


6.2 Entity: ActivityMetric
id
activity_id
metric_id
value
unit


6.3 Entity: Metric
id
name
unit
category (PHYSICAL, PERFORMANCE, ACTIVITY, AI)
sport_id (nullable)
is_time_series (boolean)


7. 🔐 Verification System (CRITICAL COMPONENT)

7.1 Verification Overview
Verification ensures data credibility.
Verification Methods:

Manual entry (low trust)
QR/Barcode scan (high trust)
Coach approval (high trust)
AI analysis (medium trust)
Event-based (official)


7.2 Entity: ActivityVerification
id
activity_id
method (QR_SCAN, COACH_APPROVAL, AI, EVENT_LINKED)
verification_level (LOW, MEDIUM, HIGH, OFFICIAL)
verified_by_user_id (nullable)
organisation_id (nullable)
token_id (FK → VerificationToken, nullable)
confidence_score (nullable)
status (PENDING, VERIFIED, REJECTED)
verified_at


7.3 Entity: VerificationToken
Description:
QR/barcode system for session verification.
id
code
issued_to_user_id (coach)
organisation_id
type (SESSION, MATCH, GYM)
expires_at
usage_limit
created_at


7.4 Entity: VerificationRequest
id
activity_id
requested_by_athlete_id
coach_id
message
status (PENDING, APPROVED, DECLINED)
responded_at


8. 🎥 Media Model

8.1 Entity: Video
id
athlete_id
activity_id (nullable)
event_id (nullable)
title
description
url
thumbnail_url
duration
visibility
upload_date


9. 🏟 Event & Match Model

9.1 Entity: Event
id
organisation_id
name
type (MATCH, TOURNAMENT, TRIAL, CAMP)
location
start_date
end_date


9.2 Entity: Participation
id
athlete_id
event_id
team_id (nullable)
position
minutes_played
stats_json
self_reported (boolean)
verified (boolean)


10. 🎯 Talent Discovery & Recruitment

10.1 Entity: Opportunity
id
organisation_id
title
description
sport_id
age_range
location
start_date
end_date
status (OPEN, CLOSED)


10.2 Entity: OpportunityApplication
id
opportunity_id
athlete_id
status (PENDING, SHORTLISTED, ACCEPTED, REJECTED)
scout_notes
created_at


10.3 Entity: Connection
id
athlete_id
scout_id
type (FOLLOW, SCOUT_INTEREST, INVITE)
status (PENDING, ACCEPTED, DECLINED)
created_at


10.4 Entity: ScoutNote
id
scout_id
athlete_id
rating
notes
visibility (PRIVATE, ORG_SHARED)


11. 🔗 Relationship Summary
User → Athlete / Coach / Scout

Athlete → Activities → Metrics
Activity → Verification → Token / Coach

Activity → Video
Activity → VerificationRequest

Event → Participation → Athlete
Participation → Verification

Scout → Athlete (Connection)
Scout → Notes → Athlete

Organisation → Opportunities
Athlete → Applications


12. 📐 Key System Capabilities Enabled
✅ Verified performance tracking
✅ Daily athlete engagement (activities)
✅ Scout filtering by trust level
✅ Event-based validation
✅ AI-ready dataset
✅ Longitudinal athlete development tracking

13. 📏 Naming & Standards
Primary Keys: UUID
Foreign Keys: {entity}_id
Enums: UPPERCASE
Timestamps: snake_case
Tables: Singular nouns


14. 🔁 Version Control
v1.0 – Initial complete data model including:
- Activity system
- Verification framework
- Talent discovery model
