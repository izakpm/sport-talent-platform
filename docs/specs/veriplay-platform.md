# VeriPlay Platform Overview

## Introduction
VeriPlay is a digital platform designed to create a trusted ecosystem for athlete development, performance tracking, and talent discovery. It addresses a critical gap in the sports industry: the lack of a structured, verifiable, and accessible system for recording athlete performance and connecting athletes with coaches, scouts, and sporting organisations.

At its core, VeriPlay transforms how athlete data is captured, validated, and shared—moving from informal, fragmented records to a structured, data-driven, and verifiable digital identity for athletes.

## The Problem
Across many sports ecosystems—particularly in countries with strong school-level competition such as South Africa—talent identification is often uneven and biased toward visibility rather than ability.

Taking rugby in South Africa as an example:

- School rugby is highly competitive and widely played.
- Many talented athletes exist across the country.
- Pathways to professional rugby are heavily concentrated in high-end schools with strong reputations, infrastructure, and established scouting pipelines.

This creates several systemic issues:

- **Limited visibility for talented athletes outside elite systems**
  Athletes in smaller or under-resourced schools often go unnoticed, regardless of ability.

- **Access inequality**
  Opportunity is often tied to geography, school resources, and exposure rather than talent alone.

- **Scouting inefficiency**
  Scouts and coaches rely heavily on known institutions, which narrows the talent pool.

- **Lost potential**
  Highly capable athletes may never reach higher levels purely due to lack of exposure.

## The Solution
VeriPlay directly addresses this imbalance by creating a structured and discoverable digital platform where every athlete has the opportunity to be seen.

The platform provides:

- A centralised athlete profile accessible regardless of school or background
- A platform where performance data—not institutional affiliation—drives visibility
- A system for capturing and sharing athlete development over time
- A future verification layer to build trust in performance claims

## Core Platform Value: Equalising Opportunity
A fundamental principle of VeriPlay is:

> Talent should determine opportunity—not visibility, location, or institutional access.

By digitising athlete profiles and standardising performance data:

- Athletes from less prominent schools gain exposure
- Scouts can discover talent beyond traditional pipelines
- Coaches can evaluate athletes using structured, comparable data
- Organisations can build more inclusive and diverse talent identification systems

## Core Platform Components

### 1. Athlete Identity and Profile
Each athlete builds a structured digital profile including:

- Personal details
- Sporting participation
- Positions played
- Performance history and achievements
- Privacy and guardian connections

This provides a consistent foundation for all users and ensures athlete identity is explicit, discoverable, and trusted.

### 2. Coach Profiles and Discoverability
Coaches also build discoverable profiles that capture:

- Coaching experience
- Team assignments and history
- Coaching achievements
- Certifications and validations

This allows clubs, universities, schools, and organisations to discover coaches based on their track record—not just reputation.

### 3. Guardian and Child Connections
The platform must support safe, role-based relationships for minors:

- Children/athletes can connect to guardians
- Guardians receive notifications and control communication access
- Coaches and organisations may only contact minors through approved guardians
- Guardian approval is required before coaches can verify a child’s activities or achievements

This ensures compliance with child safety best practices and builds trust for parents.

### 4. Athlete, Coach, and Organisation Connections
VeriPlay supports explicit connections among users:

- Athletes connect to coaches for mentorship and verification
- Athletes connect to organisations or team members for collaboration
- Coaches connect to organisations and athletes they work with

These connections create a networked ecosystem rather than isolated profiles.

### 5. Guided Onboarding Flow
A structured onboarding ensures high-quality data:

**Step 1: Sport & Position Selection**
- Choose sport(s)
- Select positions

**Step 2: Personal Details**
- Capture core identity data
- Create athlete profile

**Step 3: Guardian & Role Setup**
- Identify whether the user is an athlete, coach, guardian, or organisation representative
- Link athletes to guardians if applicable

### 6. Multi-Sport & Position Flexibility
Athletes can:

- Participate in multiple sports
- Define multiple positions
- Assign a primary sporting focus

Coaches can also specify multiple sports and specialties.

### 7. Activity & Performance Tracking
The platform will support structured activity and achievement logging:

- Activity types: practice session, gym, game, trial, training camp, etc.
- Achievement types: provincial/national selection, man of the match, awards, milestones
- Activity metadata: date, location, coach, metrics, notes
- Activity evidence: optional external media links (TikTok, Facebook, Instagram, YouTube) rather than direct uploads
- Achievement metadata: event, level, verifying coach/organisation

This builds a longitudinal record that can be validated and compared.

### 8. Verification and Trust Layer
VeriPlay introduces a trusted verification system:

- Coaches and authorised stakeholders verify activities and achievements
- Verification status is visible on athlete and coach profiles
- Verification is permissioned through guardian or athlete approval for minors
- Verified entries become trusted data points for talent discovery

### 9. Talent Discovery Ecosystem
VeriPlay enables:

- Scouts to explore talent outside traditional systems
- Clubs, schools, and universities to find athletes based on data
- Coaches to showcase their credentials and be discovered by organisations

This shifts talent discovery from institution-driven to data-driven.

### 10. Design Provisioning for the System
The platform design must make provision for:

- **Multiple user roles**: athlete, coach, guardian, organisation administrator, scout.
- **Role-based visibility**: not all data should be visible to all roles.
- **Guardian-mediated communication**: minors cannot be contacted directly by organisations or coaches without guardian involvement.
- **Connections and permissions**: explicit athlete–coach, athlete–guardian, athlete–organisation, and coach–organisation links.
- **Activity and achievement taxonomy**: extensible categories for sports actions and accomplishments.
- **Verification workflow**: request, approve, verify, and publish verification status.
- **Privacy and consent**: athlete-controlled profile visibility and guardian consent for minors.

## System Design Requirements

VeriPlay should be implemented as a platform with clear boundaries, strong safety controls, and extensibility for future growth:

- **Explicit user domains**: separate athlete, coach, guardian, organisation, and scout profiles with tailored permissions and data views.
- **Guardian-first minor safety**: any minor athlete must be connected to a guardian and all coach or organisation contact requests must route through guardian approval.
- **External media evidence**: accept only external social media and video links for activity or achievement evidence, not native media hosting.
- **Connection graph**: support explicit relationships such as athlete–guardian, athlete–coach, athlete–team and coach–organisation.
- **Verification audit trail**: store every verification request, approval action, verifier identity, and evidence source.
- **Extensible taxonomy**: make activity types, achievement types, sports, positions, and verification categories configurable.
- **Role-based access control**: enforce privacy and data visibility based on role, relationship, and consent state.
- **Modular APIs**: design the backend around purpose-specific modules for auth, profiles, verification, discovery, and notifications.

## Implementation Milestones

1. **Core profile and role model**
   - athlete, coach, guardian, organisation, scout
   - relationship connection objects
   - profile creation and discovery

2. **Safe child and guardian workflow**
   - guardian signup and link approval
   - guardian-mediated communication rules
   - consent logging for verification

3. **Structured activity and achievement data**
   - activity logging with external link evidence
   - achievement records with metadata and source
   - coach verification invitation flow

4. **Verification and trust layer**
   - verification request workflow
   - verified status badges and audit trail
   - permission checks for minors and guardians

5. **Discovery and matching**
   - coach discovery by experience and specialties
   - athlete discovery by sport, position, verified activity, and achievements
   - organisation search and connection request handling

6. **Privacy, compliance, and scale**
   - RBAC/ABAC enforcement
   - API versioning
   - monitoring, logging, and audit events
   - future-proof extension points

## Technology Architecture

### Frontend
- Next.js
- Consistent UX across landing, onboarding, and dashboard

### Backend
- NestJS
- Modular API architecture

### Database
- PostgreSQL (Supabase)
- Clean relational model

### Authentication
- JWT-based session handling

## User Journey
- Landing page → Register or login
- Onboarding → Capture structured athlete data
- Profile creation → Athlete becomes discoverable
- Dashboard → Access evolving features

## Design Principles
- **Equity-first access**
  Every athlete should have equal opportunity to be seen.

- **Structured data over reputation**
  Performance matters more than affiliation.

- **Simplicity and clarity**
  Clean and guided user experience.

- **Scalability**
  Built to grow into a full sports intelligence platform.

## Future Vision
VeriPlay will evolve into a comprehensive ecosystem including:

- Athlete performance analytics
- Media-linked scouting and review (external social links instead of hosted uploads)
- Verified performance credentials
- Talent discovery marketplace
- Organisation and team management systems

## Conclusion
VeriPlay is not just a platform—it is an infrastructure layer for fair and data-driven talent discovery in sport.

By shifting focus from where an athlete comes from to what an athlete can do, VeriPlay unlocks opportunities for thousands of overlooked athletes and enables a more inclusive and efficient sports ecosystem.

