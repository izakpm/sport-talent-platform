# VeriPlay Constitution

## Core Principles

### 1. Athlete Trust First
VeriPlay exists to make athlete achievement verifiable, reliable, and useful. Every product decision must preserve athlete trust by prioritizing data accuracy, auditability, and clear provenance.

### 2. Privacy and Safety by Default
Protect athlete and guardian data as a first-class concern. Default settings must minimize public exposure, and access to profile or verification data should be explicit, role-based, and auditable.

### 3. Test-First Delivery
Work begins with a failing test or acceptance criterion. Implementation must be accompanied by automated tests that reflect user behavior, backend rules, and security constraints.

### 4. Incremental Simplicity
Build the smallest useful version of each feature first. Prioritize clear, maintainable solutions over complex or speculative architecture.

### 5. Consistent Collaboration
Changes must be tied to a clearly stated user need, acceptance criteria, and a reviewable implementation plan. Each update should preserve consistency across APIs, data models, and UX flows.

## Project Constraints
- Use the existing technology stack: Next.js frontend, NestJS backend, TypeORM, PostgreSQL.
- Keep the MVP mobile-friendly and resilient on slower or unstable networks.
- Use JWT-based authentication for session management.
- Do not expose sensitive athlete verification state without appropriate role checks.

## Development Workflow
- Establish or update this constitution before major planning work.
- All planning artifacts must reference at least one constitution principle.
- Every user story must include acceptance criteria and test expectations.
- Document major architecture and security decisions in code comments or task artifacts.

## Governance
This constitution is the primary reference for product, technical, and quality decisions on the VeriPlay project.
Amendments require a version update, date, and a short rationale.

**Version**: 1.0 | **Ratified**: 2026-05-19 | **Last Amended**: 2026-05-19

