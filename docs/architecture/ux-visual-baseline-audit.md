# UX Visual Baseline Audit Matrix

Date: 2026-07-13
Scope: Athlete, Coach, School, and UX test baseline route

## Purpose

This audit tracks which existing frontend visuals are reusable as approved patterns and which need correction before rollout.

## Routes Audited

- frontend/app/dev/theme-preview/page.tsx
- frontend/app/dashboard/layout.tsx
- frontend/app/dashboard/page.tsx
- frontend/app/dashboard/coaches/page.tsx
- frontend/app/dashboard/schools/page.tsx

## Pass or Fix Matrix

| Route | Visual Area | Status | Notes |
|---|---|---|---|
| frontend/app/dev/theme-preview/page.tsx | Baseline visual showcase | Pass | Baseline route now includes menus, states, alerts, table patterns, token map, and approval log. |
| frontend/app/dashboard/layout.tsx | Sidebar menu, active nav, profile card | Pass | Good reusable structure and active-state behavior for shell navigation. |
| frontend/app/dashboard/page.tsx | Athlete shell, hero, cards, chips, list-style summary | Pass | Updated to approved shared tokens, responsive grid behavior, and consistent border/shadow primitives. |
| frontend/app/dashboard/coaches/page.tsx | Coach shell route | Pass | Coach-specific frontend shell is implemented with static role-focused metrics, quick actions, and upcoming sessions. |
| frontend/app/dashboard/schools/page.tsx | School shell, flow links, metrics cards | Pass | Standardized to approved token surfaces, border/shadow primitives, and responsive layout rules. |

## Approved Visual Primitives

- Vertical sidebar menu with active item state
- Hero cards and summary KPI cards
- Primary and secondary buttons
- Form fields with helper and validation states
- Badge statuses for verification and moderation
- Compact table rows for audit and moderation logs

## Shared Dashboard Primitive Layer

- Extracted shared components in `frontend/app/dashboard/components/primitives.tsx`
- Current reusable primitives: `SurfaceCard`, `MetricCard`, `ActionLinkList`, `StatusPill`
- Applied in role shells:
	- `frontend/app/dashboard/page.tsx`
	- `frontend/app/dashboard/coaches/page.tsx`
	- `frontend/app/dashboard/schools/page.tsx`

## Fix Required Before Approval

- Keep all new visuals added to frontend/app/dev/theme-preview/page.tsx first

## Approval Sign-Off

- UX test page approved: 2026-07-13
- Approved by: Product review session
- Next gate: Update shared global theme layer using approved primitives only

## Review Checklist

- Verify desktop and mobile layout behavior
- Verify token consistency from frontend/app/styles/theme.ts
- Verify readability and contrast in alerts, badges, and disabled states
- Add approval-log row before using any new visual primitive in feature routes
