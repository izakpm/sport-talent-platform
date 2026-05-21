---
title: "VeriPlay Platform MVP Implementation Plan"
---

# Implementation Plan: VeriPlay Platform MVP

**Branch**: `main` | **Date**: 2026-05-20 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `spec.md` and project constitution from `.specify/memory/constitution.md`

---

## Summary

VeriPlay transforms athlete talent discovery from institution-driven (high-visibility schools) to data-driven (verified performance). The MVP establishes a foundation where:

1. **Athletes** (esp. minors) can create structured profiles with guardian consent
2. **Coaches** are discoverable by sport, position, and verified credentials
3. **Activities & achievements** are logged with external evidence and verified by coaches
4. **Talent discovery** allows scouts and organisations to find athletes based on verified data

**Technical Approach**:
- Extend the existing Next.js frontend and NestJS backend with new role-based onboarding, profile management, verification workflows, and search/discovery APIs
- Add role-based access control (RBAC) guards to enforce athlete privacy, guardian-mediated workflows for minors, and audit logging
- Use PostgreSQL + TypeORM to model athletes, coaches, guardians, organisations, activities, achievements, verifications, and trust relationships
- Prioritise JWT-based authentication with backend role checks; frontend respects role-based UI flow routing

---

## Technical Context

**Language/Version**: 
- Backend: TypeScript + NestJS (Node.js)
- Frontend: TypeScript + Next.js (React)
- Database: PostgreSQL (TypeORM)

**Primary Dependencies**: 
- Backend: NestJS, TypeORM, JWT, class-validator
- Frontend: Next.js, React, TailwindCSS (assumed), API client library (axios or fetch)

**Storage**: PostgreSQL with migrations and TypeORM entity definitions

**Testing**: 
- Backend: Jest (unit/integration tests)
- Frontend: Jest + Testing Library (or manual smoke tests for MVP)

**Target Platform**: Web (responsive Next.js app); mobile-first but not native mobile

**Project Type**: Full-stack web application (backend API + frontend SPA)

**Performance Goals**: 
- Discovery search results within 1 second
- Athlete/coach onboarding under 3 minutes
- Activity verification approval within 48 hours

**Constraints**: 
- <500ms API response time for discovery queries
- Guardian workflows MUST block all public visibility for minors until approval
- External evidence links only (no native file uploads)
- Mobile-friendly, resilient on slower networks

**Scale/Scope**: 
- MVP: ~50–100 athlete/coach registrations per phase
- ~10 sports and 50 positions
- Full guardian-mediated workflow for minors
- 2–3 user story implementations (P1 + P2)

---

## Constitution Check

The following principles from `.specify/memory/constitution.md` are reinforced in this plan:

1. **Athlete Trust First**: All minors require guardian approval before any external visibility; verification audit trail is mandatory
2. **Privacy and Safety by Default**: Athlete profiles default to private for minors; coach and organisation connections require approval
3. **Test-First Delivery**: Each user story includes acceptance scenarios; backend tests for role checks, guardian workflows, and verification
4. **Incremental Simplicity**: MVP focuses on 4 user stories in phases; no payment, no SSO, no native apps
5. **Consistent Collaboration**: All tasks reference user stories and acceptance criteria; architecture decisions logged in task descriptions

---

## Project Structure

### Documentation (Feature Artifacts)

```text
/ (repository root)
├── spec.md              # Feature specification (4 user stories, requirements, success criteria)
├── plan.md              # This file (technical approach, architecture, structure)
├── tasks.md             # Actionable implementation tasks (7 phases)
├── docs/
│   ├── specs/
│   │   └── veriplay-platform.md     # Original platform vision
│   ├── api/
│   │   └── api-spec-v1.md           # API contract definitions (to be updated)
│   └── architecture/
│       └── README.md                 # Architecture overview
└── .specify/memory/
    └── constitution.md              # Project governance and principles
```

### Source Code Structure

```text
backend/
├── src/
│   ├── auth/                # JWT guards, role-based checks, auth strategies
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── roles.guard.ts           # [NEW] Role-based guard for FR-009
│   │   └── auth.service.ts
│   ├── users/               # User model, role assignment, profile management
│   │   ├── user.entity.ts           # [EXTEND] Add role, privacy settings
│   │   ├── users.service.ts         # [EXTEND] Guardian linking, consent
│   │   └── users.controller.ts
│   ├── athletes/            # Athlete-specific profiles, sport/position assignment
│   │   ├── athlete.entity.ts        # [NEW] Athlete profile, guardian link
│   │   ├── athletes.service.ts      # [NEW] Profile CRUD, privacy rules
│   │   └── athletes.controller.ts   # [NEW] Profile endpoints
│   ├── coaches/             # [NEW] Coach profiles, discoverability
│   │   ├── coach.entity.ts          # Coach experience, teams, certifications
│   │   ├── coaches.service.ts       # Coach CRUD, discovery queries
│   │   └── coaches.controller.ts    # Coach endpoints + search
│   ├── activities/          # Activity logging, external evidence support
│   │   ├── activity.entity.ts       # [EXTEND] External link evidence
│   │   ├── activities.service.ts    # [EXTEND] Activity CRUD with validation
│   │   └── activities.controller.ts
│   ├── verification/        # [NEW] Verification request/approval workflow, audit trail
│   │   ├── verification.entity.ts   # Verification request, approval, audit log
│   │   ├── verification.service.ts  # Request, approve, audit lifecycle
│   │   ├── verification.controller.ts
│   │   └── guardian-consent.service.ts
│   ├── trust/               # [EXTEND] Connections (athlete-coach, athlete-guardian, athlete-org, coach-org)
│   │   ├── trust.entity.ts          # [EXTEND] Explicit connection relationships
│   │   ├── trust.service.ts         # [EXTEND] Connection CRUD and approval
│   │   └── trust.controller.ts
│   ├── sports/              # Sport and position entities
│   │   ├── sport.entity.ts
│   │   ├── position.entity.ts       # [EXTEND] Link to sports
│   │   └── sports.controller.ts     # [EXTEND] Sport/position listing
│   ├── discovery/           # [NEW] Search and discovery endpoints
│   │   ├── discovery.service.ts     # Query athlete/coach by filters
│   │   └── discovery.controller.ts  # GET /athletes/search, GET /coaches/search
│   ├── app.module.ts        # [EXTEND] Import new modules
│   └── main.ts
├── test/
│   ├── unit/                # [NEW] Role guard tests, privacy rule tests
│   ├── integration/         # [NEW] Onboarding, verification, guardian workflows
│   └── fixtures/            # Test data for athletes, coaches, verifications
└── tsconfig.json

frontend/
├── app/
│   ├── layout.tsx           # [EXTEND] Auth context, role-based routing
│   ├── login/               # [EXTEND] Role-aware login page
│   │   └── page.tsx
│   ├── register/            # [EXTEND] Role selection (athlete, coach, guardian, org), signup form
│   │   └── page.tsx
│   ├── onboarding/          # [NEW] Sport/position selection, guardian linking
│   │   ├── page.tsx
│   │   ├── athlete/
│   │   │   └── page.tsx     # Sport, position, privacy settings
│   │   ├── coach/
│   │   │   └── page.tsx     # Experience, teams, certifications
│   │   └── guardian/
│   │       └── page.tsx     # Guardian approval flow
│   ├── dashboard/           # [EXTEND] Role-specific dashboard
│   │   ├── page.tsx         # Athlete: activities, verifications, profile; Coach: connected athletes, discovery
│   │   ├── profile/         # [NEW] View/edit athlete or coach profile
│   │   │   └── page.tsx
│   │   └── connections/     # [NEW] Manage trust relationships, approvals
│   │       └── page.tsx
│   ├── activities/          # [NEW] Activity logging and history
│   │   ├── page.tsx         # Activity list
│   │   ├── [id]/
│   │   │   └── page.tsx     # Activity detail, verification status
│   │   └── new/
│   │       └── page.tsx     # Activity creation form
│   ├── verification/        # [NEW] Verification requests, approval for guardians
│   │   ├── page.tsx         # Pending requests
│   │   └── [id]/
│   │       └── page.tsx     # Approval/rejection interface
│   ├── discovery/           # [NEW] Search and discover athletes/coaches
│   │   ├── page.tsx         # Discovery page with filters
│   │   ├── athletes/
│   │   │   └── [id]/
│   │   │       └── page.tsx # Athlete discovery card/detail
│   │   └── coaches/
│   │       └── [id]/
│   │           └── page.tsx # Coach discovery card/detail
│   ├── lib/
│   │   ├── api/             # [EXTEND] API client functions for new endpoints
│   │   │   ├── athletes.ts  # [NEW] GET/POST athlete profile, search
│   │   │   ├── coaches.ts   # [NEW] GET/POST coach profile, search
│   │   │   ├── activities.ts # [NEW] GET/POST/PUT activities
│   │   │   ├── verification.ts # [NEW] GET/POST verification requests
│   │   │   ├── trust.ts     # [NEW] GET/POST connections, approvals
│   │   │   └── discovery.ts # [NEW] Search queries
│   │   ├── auth/
│   │   │   ├── useAuth.ts   # [EXTEND] Auth context with role
│   │   │   └── useRole.ts   # [NEW] Hook to check role and redirect
│   │   ├── types/           # [EXTEND] TypeScript interfaces for new entities
│   │   │   ├── athlete.ts
│   │   │   ├── coach.ts
│   │   │   ├── activity.ts
│   │   │   ├── verification.ts
│   │   │   └── trust.ts
│   │   └── hooks/
│   │       └── useGuardian.ts # [NEW] Hook to check if user is guardian
│   └── styles/              # Global styles
└── tsconfig.json
```

**Structure Decision**: 
- Web application with Next.js frontend and NestJS backend
- Backend modules are organized by domain (athletes, coaches, activities, verification, discovery) with cross-cutting auth and role guards
- Frontend pages follow Next.js file-based routing with role-specific views for athletes, coaches, guardians, and organisations
- Shared TypeScript types between frontend and backend reduce errors and improve consistency

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Phase 1: Setup** → Must complete before Phase 2
2. **Phase 2: Foundational** → BLOCKS all user stories; all upstream work required before Phase 3+
3. **Phase 3 (US1)** → Can start after Phase 2; independent of later user stories
4. **Phase 4 (US2)** → Can start after Phase 2; independent of US3/US4
5. **Phase 5 (US3)** → Can start after Phase 2; independent of US4
6. **Phase 6 (US4)** → Can start after Phase 2; depends on Phase 3 and Phase 5 data population
7. **Phase 7: Polish** → Final quality and documentation; can be done in parallel with later user stories or after all core stories complete

### User Story Implementation Order (Recommended)

1. **US1 (P1) — Athlete & Guardian Onboarding**: Must be first; is the foundation for all other stories
2. **US2 (P2) — Coach Profiles**: Can run in parallel with US3 or sequentially; coach data supports verification and discovery
3. **US3 (P2) — Activity Logging & Verification**: Can run in parallel with US2; requires athlete and coach profiles to exist
4. **US4 (P3) — Discovery**: Last; requires US1 (athlete data) and US2 (coach data) to have populated the platform

### Critical Path

```
Phase 1 → Phase 2 → US1 (Athlete onboarding)
                  ↓
                  US2 (Coach profiles) + US3 (Activity & verification) [parallel]
                  ↓
                  US4 (Discovery) [after US1, US2, US3 complete]
                  ↓
                  Phase 7 (Polish & docs)
```

---

## Testing Strategy

### Backend Tests (Jest)

- **Unit Tests**: Role guards, permission checks, privacy rules, guardian-mediated workflows
- **Integration Tests**: 
  - Athlete onboarding with guardian linking and approval
  - Activity logging and verification request/approval lifecycle
  - Coach discovery with filters and permission enforcement
  - Guardian consent blocking athlete visibility until approval
- **Contract Tests**: API endpoints match spec.md acceptance scenarios

### Frontend Tests (Jest + Testing Library or manual smoke)

- **Smoke Tests**: Onboarding flow, activity creation, verification approval, discovery search
- **Role-Based Navigation**: Athlete sees activities; coach sees athletes; guardian sees approval UI
- **Edge Cases**: Minor profile creation without guardian; expired JWT; guardian rejection of verification

### Acceptance Criteria Validation

Each user story has acceptance scenarios (Given/When/Then) that must pass; tasks reference these scenarios directly.

---

## Constitution Alignment

| Principle | How Implemented |
|-----------|---|
| **Athlete Trust First** | Guardian-mediated workflows for minors; verification audit trail logged; athlete data not exposed without consent |
| **Privacy by Default** | Minor athlete profiles private until guardian approval; role-based access control enforced in all endpoints |
| **Test-First Delivery** | Each user story includes acceptance scenarios; unit and integration tests cover role checks and guardian workflows |
| **Incremental Simplicity** | MVP focuses on 4 user stories; no payment, no SSO; existing tech stack reused |
| **Consistent Collaboration** | Tasks linked to user stories and acceptance criteria; API contracts in spec and task descriptions |

---

## Key Technical Decisions

1. **External Evidence Only (No Native Uploads)**: Simplifies storage; uses external URLs for TikTok, YouTube, Instagram. Reduces GDPR/privacy burden.
2. **JWT + Role-Based Guards**: Stateless auth; role checks enforced at controller and service layer.
3. **Guardian-Mediated Visibility**: Minor athlete profiles default to private; visibility/verification requires explicit guardian approval recorded in audit trail.
4. **PostgreSQL + TypeORM**: Existing database; entity relationships modeled in code and migrations; supports complex queries for discovery and permissions.
5. **Next.js File-Based Routing**: Reduces boilerplate; role-aware layout components prevent unauthorized page access.

---

## Success Metrics

1. **User Journey Completion**: P1 and P2 stories complete without errors (95%+ success rate)
2. **Guardian Workflow Enforcement**: 100% of minor athlete activities blocked until guardian approval
3. **Verification Audit Trail**: All verification requests, approvals, and rejecters logged with timestamp and user identity
4. **Discovery Performance**: Athlete/coach search results within 1 second
5. **Mobile Responsiveness**: All flows functional on 375px (mobile) viewport

---

## Open Questions & Constraints

- **Q1**: Should athlete profiles show coach connections publicly, or only to verified scouts/organisations? → Assumption: athletes decide via privacy setting
- **Q2**: Should coach-initiated connections count as verification, or only athlete-initiated? → Assumption: both count; all routed through guardian for minors
- **Q3**: How long should a guardian approval request remain pending? → Assumption: no auto-expiry for MVP; manual rejection or re-request
- **C1**: External URL validation may not prevent malicious links → MVP accepts basic URL format validation; future: URL preview/sandboxing
- **C2**: No native file uploads simplifies initial implementation but may limit evidence quality → Future feature: integrated video upload/transcoding
