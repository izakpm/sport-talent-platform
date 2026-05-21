---
title: "VeriPlay Platform MVP Specification"
---

# Feature Specification: VeriPlay Platform MVP

**Feature Branch**: `main` (ongoing development)

**Created**: 2026-05-20

**Status**: Active

**Input**: Platform vision (`docs/specs/veriplay-platform.md`), project constitution (`.specify/memory/constitution.md`)

## User Scenarios & Testing

### User Story 1 - Athlete & Guardian Onboarding (Priority: P1)

Enable young athletes to register, build a structured digital profile, and connect safely to guardians who control visibility and verify their achievements.

**Why this priority**: Foundation for the entire platform. All athletes must have verified identity and guardian consent for minors before any other features (activities, verification, discovery) can work.

**Independent Test**: A minor athlete can complete onboarding, create a profile with sport and position, and successfully connect to a parent/guardian who approves the link. The athlete's profile is not discoverable until guardian approval is confirmed.

**Acceptance Scenarios**:

1. **Given** a new user accesses signup, **When** they select "Athlete" role, **Then** they are prompted for age and guardian contact if under 18
2. **Given** an athlete provides personal details and sport/position info, **When** they submit the form, **Then** their profile is created with `draft` visibility status
3. **Given** a minor athlete completes onboarding, **When** they invite their guardian by email/contact, **Then** the guardian receives an approval request
4. **Given** a guardian receives an approval request, **When** they approve the link, **Then** the athlete profile becomes discoverable and the guardian can view all activities
5. **Given** a guardian is linked, **When** coaches or scouts attempt to contact the athlete, **Then** the contact request is routed through the guardian first

---

### User Story 2 - Coach Profiles & Discoverability (Priority: P2)

Enable coaches to create discoverable profiles showcasing their experience, teams, certifications, and sports specialities. Allow scouts and organisations to find coaches based on data.

**Why this priority**: Coaches are key talent connectors. Discoverability unlocks the ecosystem for organisations to find the right coaches and accelerates talent identification partnerships.

**Independent Test**: A coach can create a profile with experience, certifications, and sports/positions taught. An organisation can search and discover coaches by sport and view their credentials and verified achievements.

**Acceptance Scenarios**:

1. **Given** a coach signs up and selects "Coach" role, **When** they complete their profile with teams, experience, and sports, **Then** their profile is created with public visibility
2. **Given** a coach has linked athletes and verified activities, **When** their profile is viewed, **Then** verified badges are displayed alongside their record
3. **Given** an organisation searches for "rugby coaches," **When** filters are applied (sport=rugby, position=scrum-half), **Then** matching coaches are returned ranked by verification status
4. **Given** a coach's profile is viewed by an organisation, **When** the organisation clicks "connect," **Then** a connection request is sent to the coach
5. **Given** a coach receives a connection request, **When** they approve it, **Then** the organisation can view their full team history and credentials

---

### User Story 3 - Activity Logging & Verification (Priority: P2)

Support athletes and coaches in logging training, games, trials, and achievements with optional external evidence (TikTok, Instagram, YouTube links). Enable verification by coaches and organisations.

**Why this priority**: Structured activity data drives talent discovery. Verification builds trust in claims. Minors require guardian consent before verification badges are awarded.

**Independent Test**: An athlete can log a game performance with external video evidence. A coach can request verification. For minors, the guardian must approve before the activity is marked verified and becomes discoverable.

**Acceptance Scenarios**:

1. **Given** an athlete navigates to activities, **When** they create an activity (e.g., game, practice), **Then** they provide date, location, metrics, and optional external media links
2. **Given** an activity is logged, **When** it is submitted, **Then** the coach or trainer who worked with the athlete receives a verification prompt
3. **Given** a coach receives a verification request, **When** they review and approve it, **Then** the activity is marked "verified" and a badge is added to the athlete's profile
4. **Given** a minor athlete logs an activity, **When** verification is requested, **Then** the guardian must approve before the activity becomes visible to scouts
5. **Given** activities are verified, **When** a scout searches for athletes, **Then** verified achievements appear in search results and filter results

---

### User Story 4 - Talent Discovery Ecosystem (Priority: P3)

Enable scouts, coaches, and organisations to discover athletes and coaches based on data (sport, position, verified achievements, location if applicable).

**Why this priority**: Shifts talent identification from institution-driven to data-driven. Extends the MVP beyond P1/P2 to unlock full value once athletes and coaches have populated the platform.

**Independent Test**: A scout can search for "rugby wing-threequarters with verified match play" and discover athletes from under-resourced schools. Organisations can search for coaches with specific certifications.

**Acceptance Scenarios**:

1. **Given** a scout accesses the discovery page, **When** they filter by sport (rugby), position (wing), and verified achievements, **Then** matching athletes are returned in descending order of verification
2. **Given** a scout views an athlete result, **When** they click "view profile," **Then** they see sport history, verified activities, and coach connections (if athlete profile is public)
3. **Given** a scout finds a promising athlete, **When** they click "request connection," **Then** a message is sent to the athlete/guardian for approval
4. **Given** a scout discovers multiple athletes matching criteria, **When** they filter by location or coach, **Then** results are further narrowed
5. **Given** an organisation searches for coaches, **When** they apply filters for sport and certification, **Then** coaches are returned ranked by verified athlete outcomes

---

### Edge Cases

- What happens if a minor athlete's profile is created but the guardian link is never approved? → Profile remains private; athlete cannot be discovered until guardian approves.
- How does the system handle if a guardian disapproves a verification request? → Activity remains unverified; athlete is notified; coach can request again if activity details change.
- What if an athlete is over 18 during onboarding but turns 18 later? → No special handling needed; once 18, athlete transitions to independent control (future work).
- What if an activity is logged with an invalid external media link? → System validates URL format; athlete is notified to correct before submission.

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST support role-based user registration (athlete, coach, guardian, organisation, scout) with role-specific onboarding flows
- **FR-002**: System MUST allow athletes to create and manage structured digital profiles including personal details, sports, positions, and privacy settings
- **FR-003**: System MUST enforce guardian-mediated workflows for minors: athletes under 18 MUST link to a guardian before any external visibility or verification
- **FR-004**: System MUST support coach profiles with experience, teams, certifications, and specialities; coaches MUST be discoverable by sport and position
- **FR-005**: System MUST allow athletes and coaches to log activities (practice, game, trial, training camp) with external evidence links (YouTube, TikTok, Instagram, etc.) but NOT native file uploads
- **FR-006**: System MUST implement a verification request/approval workflow where coaches and organisations can verify athlete activities; verification requests for minors MUST route through guardian approval
- **FR-007**: System MUST display verification badges and status on athlete and coach profiles; verified achievements MUST be visible to scouts and organisations
- **FR-008**: System MUST provide athlete and coach discovery endpoints with filters for sport, position, verified status, and location (if available)
- **FR-009**: System MUST enforce role-based access control: athlete profiles are only visible to connected coaches, scouts, and organisations (or the public if athlete chooses); minor athlete data is only visible with guardian consent
- **FR-010**: System MUST maintain an audit trail for all verification requests, approvals, rejections, and verifier identity
- **FR-011**: System MUST support explicit connections between athletes and coaches, athletes and guardians, athletes and organisations, and coaches and organisations
- **FR-012**: System MUST log all security events related to authentication, authorisation, and guardian workflows for compliance

### Key Entities

- **Athlete**: User with sports participation, positions played, activities, and achievements; minors link to guardians
- **Coach**: User with experience, teams, certifications, specialities; discoverable and verifiable
- **Guardian**: User responsible for consent and verification approval for minor athletes; receives notifications
- **Organisation**: User (e.g., club, school, professional team, academy) that discovers and connects with athletes and coaches
- **Scout**: Role within or external to an organisation; accesses discovery tools and athlete profiles
- **Sport**: Category (e.g., rugby, football, netball); associated with athletes and coaches
- **Position**: Role within a sport (e.g., scrum-half, wing-threequarter); associated with athletes
- **Activity**: Logged event (practice, game, trial, training camp) with date, location, metrics, and optional external evidence link
- **Achievement**: Notable accomplishment (provincial selection, man of the match, award); includes metadata and verifier identity
- **Verification**: Request, approval, and audit trail for validating activities and achievements; requires guardian consent for minors
- **Trust/Connection**: Explicit link between athletes and coaches, athletes and guardians, athletes and organisations, coaches and organisations

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: An athlete can complete onboarding (role selection, personal details, sport/position, guardian link) in under 3 minutes
- **SC-002**: A minor athlete's profile is not discoverable by any external user until a guardian has approved the link; verified activities are logged in the audit trail
- **SC-003**: A coach can create a profile and be discoverable by sport and position within their first session; discovery returns results within 1 second
- **SC-004**: An activity logged with external evidence can be verified by a coach within 48 hours of submission; guardian-mediated minors receive guardian approval notification within 1 hour
- **SC-005**: A scout can discover athletes by sport/position/verified-status and view at least 10 matching results; discovery does not expose private athlete data
- **SC-006**: 100% of verification requests for minor athletes are routed through guardian; no verification can be granted without guardian approval recorded in audit trail
- **SC-007**: All authentication and role-based access control decisions are logged; no athlete or minor data is exposed outside role and guardian consent boundaries
- **SC-008**: Platform is mobile-responsive and functions on 4G and slower networks with graceful degradation for slow uploads/downloads
- **SC-009**: 95% of user journeys in P1 and P2 stories complete without errors (smoke test pass rate)

---

## Assumptions

- Existing Next.js frontend and NestJS backend can be extended to support new roles, onboarding flows, and discovery features
- PostgreSQL database and TypeORM are available for entity models
- JWT authentication is in place and can be extended with role-based guards
- External social media links are verified by basic URL validation; full link preview/transcoding is out of scope for MVP
- Mobile-first design is a requirement but native mobile apps (iOS/Android) are out of scope for MVP (responsive web only)
- Athlete and coach profiles are assumed to be publicly discoverable unless explicitly marked private; privacy defaults are permissive (discoverable) but guardians can override for minors
- Email notifications for guardian approval and verification requests are assumed; SMS is out of scope for MVP
- No payment or subscription logic is included in MVP
- User authentication (signup/login) via email and password is in place; OAuth/SSO is out of scope for MVP
