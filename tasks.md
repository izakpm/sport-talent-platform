---
description: "Task list for VeriPlay Platform MVP implementation"
---

# Tasks: VeriPlay Platform MVP

**Input**: `docs/specs/veriplay-platform.md`, `.specify/memory/constitution.md`

**Prerequisites**: `plan.md` (not yet created), `spec.md` (not yet created), existing backend/frontend modules

**Tests**: Backend and frontend tests for user journeys should be added alongside implementation tasks.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify the repo structure and establish the implementation baseline.

- [ ] T001 Verify backend and frontend dependency installation and scripts in `backend/package.json` and `frontend/package.json`
- [ ] T002 Confirm existing `backend/src/` modules and `frontend/app/` pages can support athlete, coach, guardian, verification, and discovery features
- [ ] T003 Create or update shared frontend types and API helpers in `frontend/app/lib/` for backend contract consistency
- [ ] T004 Add repo-level task artifact `tasks.md` and link it to the platform vision documents

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the core backend and security foundations that all user stories depend on.

- [ ] T005 Review and document the core data model for athlete, coach, guardian, organisation, sport, position, activity, achievement, and verification in `backend/src/`
- [ ] T006 Implement or extend role-based authentication and authorization in `backend/src/auth/`, including JWT guards and role checks for athlete, coach, guardian, and organisation
- [ ] T007 Implement child safety and guardian-mediated permission checks in backend guards or services, ensuring minors require guardian approval for verification and contact workflows
- [ ] T008 Add backend audit trail support for verification requests, approvals, and status changes in `backend/src/verification/`
- [ ] T009 Ensure backend modules are wired together with clear APIs for athletes, users, verification, activities, sports, positions, and trust relationships
- [ ] T010 Add frontend global auth/session support and secure client-side role handling in `frontend/app/` and `frontend/app/lib/`
- [ ] T011 Add or update API documentation in `docs/api/api-spec-v1.md` to include the core onboarding, profile, verification, and discovery endpoints

**Checkpoint**: Foundation complete; user stories can begin.

---

## Phase 3: User Story 1 - Athlete & Guardian Onboarding (Priority: P1) 🎯 MVP

**Goal**: Enable athlete users to create a structured profile and connect to guardians safely.

**Independent Test**: Athlete signup with role selection, profile creation, and guardian connection works end to end.

### Implementation

- [ ] T012 Extend or create athlete profile backend APIs in `backend/src/athletes/` to support personal details, sports, positions, and privacy settings
- [ ] T013 Extend user onboarding in `backend/src/users/` and `backend/src/auth/` to support athlete, guardian, coach, and organisation role selection
- [ ] T014 Implement guardian connection backend endpoints in `backend/src/users/` or `backend/src/athletes/` with approval workflow
- [ ] T015 Build athlete onboarding pages and forms in `frontend/app/register/`, `frontend/app/onboarding/`, and `frontend/app/login/`
- [ ] T016 Build guardian connection UI in `frontend/app/onboarding/` and `frontend/app/dashboard/` to request and accept athlete/guardian links
- [ ] T017 Add frontend validation and role-specific navigation to keep minors from being contacted directly without guardian approval

### Tests

- [ ] T018 Add backend integration tests for athlete signup, profile creation, and guardian approval flows in `backend/test/`
- [ ] T019 Add frontend smoke or integration tests for onboarding flows in `frontend/` using the existing test framework or manually verified scenarios

**Checkpoint**: Athlete and guardian onboarding should function independently.

---

## Phase 4: User Story 2 - Coach Profiles & Discoverability (Priority: P2)

**Goal**: Enable coaches to create discoverable profiles and for organisations to search coaches by sport, position, and credentials.

**Independent Test**: Coach profile creation and coach discovery work independently of activity logging.

### Implementation

- [ ] T020 Extend the backend coach/profile model in `backend/src/users/` or `backend/src/trust/` to capture experience, teams, certifications, and sports specialities
- [ ] T021 Implement coach discovery and search endpoints in `backend/src/users/` or `backend/src/sports/` with filters for sport, position, and verification status
- [ ] T022 Build frontend coach profile pages and discovery UI in `frontend/app/dashboard/`, `frontend/app/trust/`, or a new `frontend/app/coaches/` area
- [ ] T023 Add backend privacy controls so coach profile details are visible only to appropriate roles and connected organisations
- [ ] T024 Add a coach profile summary component and search results UI in `frontend/app/dashboard/`

### Tests

- [ ] T025 Add backend tests for coach profile creation, visibility rules, and discovery filters in `backend/test/`
- [ ] T026 Add frontend test cases for coach search and profile display in `frontend/`

**Checkpoint**: Coaches are discoverable and their profiles respect role-based visibility.

---

## Phase 5: User Story 3 - Activity Logging & Verification (Priority: P2)

**Goal**: Support athlete activity and achievement logging, plus a verification approval workflow with guardian consent for minors.

**Independent Test**: Activities and achievements can be logged, verified, and displayed with correct permission checks.

### Implementation

- [ ] T027 Implement activity and achievement entities/controllers in `backend/src/activities/` and `backend/src/verification/`
- [ ] T028 Add support for external evidence links (TikTok, Instagram, YouTube, etc.) in backend activity/achievement payloads
- [ ] T029 Implement verification request, approval, and audit trail flows in `backend/src/verification/`
- [ ] T030 Build frontend activity logging and achievement submission flows in `frontend/app/activities/`
- [ ] T031 Add UI for verification status, pending requests, and guardian approval in `frontend/app/verification/`
- [ ] T032 Ensure minor athlete verification requests are routed through guardian review before a verification badge is granted

### Tests

- [ ] T033 Add backend tests for activity creation, verification request lifecycle, and audit trails in `backend/test/`
- [ ] T034 Add frontend tests for submitting activities, evidence links, and viewing verification states in `frontend/`

**Checkpoint**: Activity logging and verification workflows are independently functional.

---

## Phase 6: User Story 4 - Talent Discovery Ecosystem (Priority: P3)

**Goal**: Provide discovery tools so scouts, organisations, and coaches can find athletes and coaches using data-driven filters.

**Independent Test**: Search and discovery flows return relevant athletes or coaches based on sport, position, and verification.

### Implementation

- [ ] T035 Implement athlete discovery endpoints in `backend/src/athletes/` with filters for sport, position, verified achievements, and location if available
- [ ] T036 Implement organisation search or connection endpoints in `backend/src/users/` or `backend/src/trust/`
- [ ] T037 Build frontend discovery dashboard and filtered results UI in `frontend/app/dashboard/`
- [ ] T038 Add connection request flows from discovery results to athlete, coach, or organisation profiles
- [ ] T039 Ensure backend discovery responses respect privacy rules and guardian-mediated visibility for minors

### Tests

- [ ] T040 Add backend tests for athlete and coach discovery filters and permission enforcement
- [ ] T041 Add frontend tests for search/filter UI and connection request flow

**Checkpoint**: Discovery ecosystem can operate independently after foundational features.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Finalize quality, documentation, security, and cross-cutting platform requirements.

- [ ] T042 Update `docs/api/api-spec-v1.md` with the final onboarding, profile, verification, and discovery contract definitions
- [ ] T043 Add or extend backend unit tests for existing models and guards in `backend/test/`
- [ ] T044 Add or extend frontend test coverage around onboarding, verification, and discovery in `frontend/`
- [ ] T045 Add privacy and consent documentation to `docs/` or the README, referencing guardian-first safety and role-based access
- [ ] T046 Conduct a security review of backend role checks and JWT authorization in `backend/src/auth/`
- [ ] T047 Review `frontend/app/` flows for mobile-responsiveness and network resilience
- [ ] T048 Document any required amendment to `.specify/memory/constitution.md` with rationale and version info

---

## Dependencies & Execution Order

- **Phase 1**: Start immediately
- **Phase 2**: Blocks all user stories until complete
- **Phase 3+**: Begin once foundational backend/auth and frontend auth support are in place
- **Phase 7**: Final polish after core user stories are implemented

## Notes

- This backlog is based on the current platform vision in `docs/specs/veriplay-platform.md` and project principles in `.specify/memory/constitution.md`
- If a more detailed `spec.md` and `plan.md` are created, this task list should be refined to match the final feature boundaries and acceptance criteria
