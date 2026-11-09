---
description: "Task list for VeriPlay Platform MVP implementation"
---

# Tasks: VeriPlay Platform MVP

**Input**: `spec.md`, `plan.md`, `docs/specs/veriplay-platform.md`, `.specify/memory/constitution.md`

**Prerequisites**: `spec.md` and `plan.md` are active and synchronized with the current sprint goal.

**Tests**: Follow test-first delivery. For each user story, create or update failing checks first, then implement, then pass checks.

**Organization**: Tasks are grouped by user story and delivery phase. Existing pages must be verified before new pages are introduced.

## Phase 1: Current-State UI Verification (Shared Baseline)

**Purpose**: Verify current frontend routes and identify what can be reused versus corrected.

- [x] T001 Audit existing visual baseline route in `frontend/app/dev/theme-preview/page.tsx` against current frontend usage
- [x] T002 Audit existing athlete shell pages in `frontend/app/dashboard/page.tsx` and `frontend/app/dashboard/profile/page.tsx`
- [x] T003 Audit existing coach shell page in `frontend/app/dashboard/coaches/page.tsx`
- [x] T004 Audit existing school shell page in `frontend/app/dashboard/schools/page.tsx`
- [x] T005 Produce a pass/fix-needed matrix for menus, lists, buttons, input fields, cards, and color usage
- [x] T006 Define acceptance checklist for visual approval gate and include mobile viewport checks

**Checkpoint**: Reuse and correction targets are known before new UI work starts.

---

## Phase 2: User Story 0 - Visual Approval Baseline (Priority: P0) MVP

**Goal**: Ensure all shared UI primitives are approved in one route before being used in product pages.

**Independent Test**: A reviewer can inspect one page that contains all approved UI primitives and their major states.

### Tests First

- [ ] T007 Add frontend tests for visual baseline route render and required sections in `frontend/`
- [ ] T008 Add responsive checks for the visual baseline route at mobile and desktop breakpoints

### Implementation

- [x] T009 Extend `frontend/app/dev/theme-preview/page.tsx` to include approved menus, lists, buttons, inputs, cards, badges, and state variants
- [x] T010 Add usage notes and state labels directly in the visual approval page for reviewer clarity
- [x] T011 Add a lightweight approval log section in the visual page for newly introduced primitives
- [x] T012 Add governance note to frontend docs: new primitives must be added to visual baseline first

**Checkpoint**: Visual approval route is complete and review-ready.

---

## Phase 3: Theme Alignment After Approval (Priority: P1)

**Goal**: Update global theme tokens only after visual baseline approval.

**Independent Test**: Approved tokens/styles propagate consistently across baseline components.

### Tests First

- [ ] T013 Add token consistency tests or assertions for theme keys used by baseline components
- [ ] T014 Add regression checks to confirm updated theme does not break approved baseline visuals

### Implementation

- [x] T015 Update theme tokens in `frontend/app/styles/theme.ts` using approved visual baseline outcomes
- [x] T016 Update global style surfaces in `frontend/app/globals.css` and related shared styles
- [x] T017 Re-validate baseline route after theme updates and capture approval sign-off

**Checkpoint**: Theme updates are approved and stable.

---

## Phase 4: User Story 2A - Frontend Profile Layout Foundations (Priority: P1)

**Goal**: Build or correct basic layouts for Athlete, Coach, and School profiles without backend functionality.

**Independent Test**: All three role layouts render correctly with placeholder/mock content and match approved visual primitives.

### Tests First

- [x] T018 Add route smoke tests for athlete, coach, and school shell pages in `frontend/`
- [x] T019 Add responsive tests for role layouts at mobile and desktop breakpoints

### Implementation

- [x] T020 Correct and stabilize athlete shell layout in `frontend/app/dashboard/athlete/page.tsx` and `frontend/app/dashboard/profile/page.tsx`
- [x] T021 Correct and stabilize coach shell layout in `frontend/app/dashboard/coaches/page.tsx`
- [x] T022 Correct and stabilize school shell layout in `frontend/app/dashboard/schools/page.tsx`
- [x] T023 Remove hard backend dependency from shell pages by using safe placeholder/mock states where needed
- [x] T024 Ensure role menus, lists, cards, actions, and input blocks only use approved baseline primitives
- [x] T025 Add a UI verification note per role page documenting pass/fix updates applied
- [x] T036 Implement shared role-driven dashboard shell and guard routing in `frontend/app/dashboard/layout.tsx` and `frontend/app/dashboard/core/roles.ts`
- [x] T037 Consolidate athlete routes under `frontend/app/dashboard/athlete/` and update menu links
- [x] T038 Align coach page set and menu to required routes (Teams, Calander, Activities, Matches, Approvals, Achievements)
- [x] T039 Align school page set and menu to required routes (Coaches, Teams, Fixtures, Logs, Achievements)
- [x] T040 Add legacy compatibility redirects for `/dashboard/athletes/*`, `/activities`, and `/sports`
- [x] T041 Improve profile photo save reliability (`backend/src/main.ts` payload limits + frontend save feedback)

**Checkpoint**: Athlete, coach, and school shells are visually approved and frontend-only stable.

---

## Phase 5: Backend and Integration Foundations (Deferred After Shell Approval)

**Purpose**: Continue with data-backed MVP capabilities after UI baseline and shells are approved.

- [ ] T026 Implement or extend role-based auth and guard behavior in `backend/src/auth/`
- [ ] T027 Implement guardian-mediated workflow rules and verification audit trail in `backend/src/verification/`
- [ ] T028 Implement security event logging for authentication, authorization, and guardian workflow decisions
- [ ] T029 Wire profile and discovery modules for athlete and coach data-backed experiences
- [ ] T030 Integrate frontend shell pages with backend APIs once contracts are finalized
- [ ] T042 Perform Google OAuth end-to-end registration/login validation (ATHLETE, COACH, SCHOOL) after Google Cloud redirect URI and credential configuration is finalized

**Checkpoint**: Data-backed behaviors can be layered onto approved UI foundations.

---

## Phase 6: Polish and Governance

**Purpose**: Lock quality and maintain the visual approval process as an ongoing rule.

- [ ] T031 Update `docs/api/api-spec-v1.md` to match implemented contracts
- [ ] T032 Add privacy, consent, and role-visibility documentation updates in `docs/` and project READMEs
- [ ] T033 Add CI checks (or equivalent) to ensure visual baseline route remains present and tested
- [ ] T034 Confirm that every newly introduced UI primitive appears in the visual approval route before release
- [ ] T035 Review and update `.specify/memory/constitution.md` amendment log if governance rules changed

---

## Dependencies & Execution Order

1. **Phase 1** must complete before Phase 2.
2. **Phase 2** must be approved before Phase 3 and Phase 4.
3. **Phase 3** (theme alignment) depends on visual baseline approval.
4. **Phase 4** (frontend role shells) can proceed in parallel with approved theme updates.
5. **Phase 5** starts only after role shell approval.
6. **Phase 6** finalizes docs, tests, and governance.

## Notes

- This backlog reflects the immediate priority: visual consistency and frontend profile foundations first.
- If an existing page already satisfies the baseline, keep it and only apply targeted corrections.
- School pages represent the organisation-facing profile experience for the current frontend milestone.

## Next Focus (Updated)

1. Complete Phase 4 tests: T018 and T019.
2. Remove remaining hard backend dependency in role shell flows to complete T023.
3. Close primitive-usage parity sweep for all role pages and profile pages to complete T024.
4. Validate new route structure with browser smoke checks for athlete/coach/school role menus and redirects.
5. Start Phase 5 only after Phase 4 checkpoint is confirmed.
6. Re-run deferred Google OAuth E2E validation (T042) once OAuth console setup is confirmed stable.
