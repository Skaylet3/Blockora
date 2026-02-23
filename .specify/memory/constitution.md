<!--
SYNC IMPACT REPORT
==================
Version change: N/A → 1.0.0 (initial constitution)
Added sections:
  - Core Principles (I–VI)
  - Tech Stack
  - Development Workflow
  - Governance
Templates requiring updates:
  - .specify/templates/plan-template.md       ✅ aligned (no conflicts)
  - .specify/templates/spec-template.md       ✅ aligned (no conflicts)
  - .specify/templates/tasks-template.md      ✅ aligned (no conflicts)
Deferred TODOs:
  - None
-->

# Blockora Constitution

## Core Principles

### I. Blocks Are Atomic

Every piece of user content MUST be modeled as an independent Block. Blocks are self-contained
units with: Title, Content, Type, Tags, Status, Visibility, and Owner. No feature may merge
or entangle the block model with unrelated domain concepts. Block schema changes require
explicit migration and versioning.

**Rationale**: The entire product value proposition rests on modular, retrievable content units.
Violating atomicity breaks search, filtering, and the core UX promise.

### II. Privacy by Default

User data MUST be private by default. No block, profile, or account data may be accessible
to any user other than the owner without an explicit, deliberate action by the owner.
Backend queries MUST always scope data to the authenticated user. Zero data leaks between
users are a hard requirement — not a best effort.

**Rationale**: Security and trust are non-negotiable for a personal knowledge tool. A single
data leak destroys user confidence permanently.

### III. Simplicity Over Features

The MVP MUST NOT include: team workspaces, real-time editing, file uploads, notifications,
messaging, or recommendation algorithms. Every feature added beyond the defined MVP scope
MUST go through explicit product review. When in doubt, leave it out. YAGNI applies strictly.

**Rationale**: Blockora's brand promise is clarity and focus. Feature creep is an existential
threat to the product identity. Complexity must always be justified.

### IV. Performance is a Feature

Search results MUST appear with no perceptible delay (target: <200ms). Block creation MUST
complete in under 5 seconds end-to-end. The UI MUST remain responsive during all operations.
Pagination, lazy loading, and efficient queries are REQUIRED — not optional optimizations.

**Rationale**: Speed is a core UX principle. A slow Blockora is a broken Blockora.

### V. Type-Safe and Test-Driven

All code MUST be written in TypeScript with strict mode enabled. Any new feature MUST have
accompanying tests before the implementation is considered complete. The backend (NestJS)
MUST validate all incoming data at API boundaries using DTOs and class-validator. The frontend
MUST NOT bypass TypeScript type checks.

**Rationale**: Type safety prevents entire classes of bugs. Given the data-privacy requirement,
untested or untyped code is unacceptable.

### VI. Monorepo Discipline

The project is a Turborepo monorepo. `apps/web` is the Next.js frontend (UI only — no
business logic). `apps/api` is the NestJS backend (all business logic, data access, auth).
Shared code (types, utilities, UI components) MUST live in `packages/`. Cross-app imports
outside of `packages/` are forbidden. Each app must be independently buildable and deployable
as a Docker container.

**Rationale**: Clean separation of concerns enables independent scaling and deployment.
Turborepo is a build tool only — it does not exist at runtime.

## Tech Stack

**Frontend**: Next.js 16, React 19, Tailwind CSS v4, TypeScript 5
**Backend**: NestJS 11, TypeScript 5, class-validator, class-transformer
**Database**: PostgreSQL (primary data store)
**Auth**: JWT-based authentication (access + refresh tokens)
**Search**: PostgreSQL full-text search (MVP); upgrade path to Elasticsearch (Phase 2)
**Monorepo**: Turborepo + Yarn workspaces
**Deployment**: Docker containers on AWS ECS behind an Application Load Balancer
**Package Manager**: Yarn 1.22 (classic)
**Node**: >=18 required

Technology changes MUST be recorded as a MINOR or MAJOR constitution amendment depending
on scope. No ad-hoc dependency additions without team review.

## Development Workflow

1. Every feature MUST start with a spec (`/speckit.specify`) before any code is written.
2. Specs MUST be reviewed and approved before an implementation plan is created.
3. Implementation MUST follow the plan produced by `/speckit.plan` and `/speckit.tasks`.
4. A feature is NOT complete until `/speckit.checklist` passes.
5. All PRs MUST reference the relevant spec file.
6. Database schema changes MUST include a migration file — no direct schema mutations.
7. API endpoints MUST follow RESTful conventions and be documented.
8. Secrets MUST never be committed — use `.env` files excluded from version control.

## Governance

This constitution supersedes all other practices and conventions within the Blockora project.
Any amendment requires: (1) a written justification, (2) a version bump following semantic
versioning, and (3) updating this file plus all affected spec/plan/task templates.

All implementation work MUST be verified against the constitution before merge. If a PR
conflicts with a principle, the principle wins — not the deadline.

Amendment procedure:
- PATCH (x.x.N): Wording clarifications, typo fixes — single author approval.
- MINOR (x.N.0): New principle or section added — team review required.
- MAJOR (N.0.0): Principle removed, redefined, or backward-incompatible change — full
  team consensus + migration plan required.

**Version**: 1.0.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
