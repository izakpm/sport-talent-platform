
## 📚 Endpoints Overview

- Authentication
- Athlete Profile
- Activities
- Verification
- Videos
- Events
- Scouts & Discovery
- Opportunities

# Sport Talent Platform  
## API Specification v1.0

**Version:** 1.0  
**Date:** May 2026  
**Status:** Draft
🔷 1. API Design Principles

RESTful architecture
JSON-based communication
JWT authentication
Role-based access control
Versioned API

Base URL: /api/v1


🔷 2. Authentication & Users

✅ Register User
POST /auth/register
JSON{  "email": "user@email.com",  "password": "securePassword",  "role": "ATHLETE"}Show more lines

✅ Login
POST /auth/login
JSON{  "email": "user@email.com",  "password": "securePassword"}Show more lines
✅ Response:
JSON{  "token": "jwt_token",  "user": {    "id": "uuid",    "role": "ATHLETE"  }}Show more lines

🔷 3. Athlete Profile

✅ Create Athlete Profile
POST /athletes
JSON{  "first_name": "Izak",  "last_name": "Meyer",  "date_of_birth": "2009-05-01",  "province": "Gauteng",  "school_id": "uuid"}Show more lines

✅ Get Athlete Profile
GET /athletes/{id}

✅ Update Athlete Profile
PUT /athletes/{id}

✅ Add Sport
POST /athletes/{id}/sports
JSON{  "sport_id": "uuid",  "position": "Scrumhalf",  "level": "SCHOOL"}Show more lines

🔷 4. Activity System (CORE)

✅ Create Activity
POST /activities
JSON{  "type": "PRACTICE",  "sport_id": "uuid",  "title": "Afternoon Training",  "start_time": "2026-05-13T15:00",  "end_time": "2026-05-13T17:00",  "location": "School Field"}Show more lines

✅ Get Athlete Activities
GET /athletes/{id}/activities

✅ Get Activity
GET /activities/{id}

🔷 5. Activity Metrics

✅ Add Metrics to Activity
POST /activities/{id}/metrics
JSON[  {    "metric_id": "distance",    "value": 5.2,    "unit": "km"  },  {    "metric_id": "sprints",    "value": 18,    "unit": "count"  }]Show more lines

🔷 6. 🔐 Verification System (Your Key Feature)

✅ 6.1 Create Verification Token (Coach)
POST /verification/tokens
JSON{  "type": "SESSION",  "organisation_id": "uuid",  "expires_in_minutes": 120}Show more lines
✅ Response:
JSON{  "token_id": "uuid",  "qr_code": "base64_image",  "code": "ABC123"}Show more lines

✅ 6.2 Scan QR Code (Athlete)
POST /verification/scan
JSON{  "code": "ABC123",  "activity_id": "uuid"}Show more lines
✅ Result:

Links athlete to session
Creates verification automatically


✅ 6.3 Request Verification (Manual Entry)
POST /verification/request
JSON{  "activity_id": "uuid",  "coach_id": "uuid",  "message": "Please verify my training session"}Show more lines

✅ 6.4 Approve Verification (Coach)
POST /verification/approve
JSON{  "request_id": "uuid",  "status": "APPROVED"}Show more lines

✅ 6.5 Get Activity Verification Status
GET /activities/{id}/verification

🔷 7. Video Upload

✅ Upload Video
POST /videos
JSON{  "activity_id": "uuid",  "title": "Game Highlights",  "url": "video_url"}Show more lines

✅ Get Athlete Videos
GET /athletes/{id}/videos

🔷 8. Event & Match System

✅ Create Event (Coach/Org)
POST /events
JSON{  "name": "School Rugby Match",  "type": "MATCH",  "location": "Pretoria",  "start_date": "2026-06-01"}Show more lines

✅ Add Participation
POST /events/{id}/participation
JSON{  "athlete_id": "uuid",  "position": "Wing",  "minutes_played": 60,  "stats": {    "tries": 2,    "tackles": 5  }}Show more lines

🔷 9. Scouts & Discovery

✅ Search Athletes
GET /scouts/search
Query params:
?sport=rugby
&position=wing
&province=gauteng
&verified=true


✅ Connect with Athlete
POST /connections
JSON{  "athlete_id": "uuid",  "type": "SCOUT_INTEREST"}Show more lines

✅ Add Scout Note
POST /scouts/notes
JSON{  "athlete_id": "uuid",  "rating": 8,  "notes": "Strong pace and positioning"}Show more lines

🔷 10. Opportunities (Recruitment)

✅ Create Opportunity
POST /opportunities
JSON{  "title": "University Rugby Trials",  "sport_id": "uuid",  "age_range": "U18",  "location": "Johannesburg"}Show more lines

✅ Apply for Opportunity
POST /opportunities/{id}/apply

✅ View Applications
GET /opportunities/{id}/applications

🔷 11. Trust Score (Future Endpoint)

✅ Get Athlete Trust Score
GET /athletes/{id}/trust-score
✅ Response:
JSON{  "score": 82,  "breakdown": {    "verified_activities": 40,    "coach_verifications": 30,    "event_participation": 12  }}Show more lines

🔷 12. Permissions (High-Level)

RoleKey AccessAthleteOwn dataGuardianAthlete oversightCoachVerify activitiesScoutSearch + connectAdminFull access

🔷 13. API Security

✅ JWT authentication
✅ Role-based middleware
✅ Rate limiting
✅ Input validation

🔷 14. Suggested Tech Stack

Backend: Node.js (NestJS) or Django
Auth: JWT + refresh tokens
DB: PostgreSQL
Storage: S3 / Cloudflare
AI: Python microservices later
