<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0 (MINOR: two new principles added — Notes/Storage Hierarchy and Tasks System)
Modified principles:
  - Principle I (Blocks Are Atomic): Expanded to include block types and task-type cross-domain bridge
  - Principle II (Privacy by Default): Scope extended to cover notes, storages, and tasks
  - Principle III (Simplicity Over Features): MVP scope updated to explicitly include Notes and Tasks
Added sections:
  - Principle VII: Notes and Storage Hierarchy
  - Principle VIII: Tasks System
Removed sections:
  - None
Templates requiring updates:
  - .specify/templates/plan-template.md       ✅ aligned (generic, no entity-specific refs requiring change)
  - .specify/templates/spec-template.md       ✅ aligned (generic, no entity-specific refs requiring change)
  - .specify/templates/tasks-template.md      ✅ aligned (generic, no entity-specific refs requiring change)
Deferred TODOs:
  - None
-->

# Blockora Constitution

## Core Principles

### I. Blocks Are Atomic

Every piece of user content MUST be modeled as an independent Block. Blocks are self-contained
units with: Title, Content, Type, Tags, Status, Visibility, and Owner. Blocks support multiple
types — including `task` — which may trigger integrations with other product domains (e.g., a
block of type `task` can be promoted to the Tasks todo list via a dedicated action button).
No feature may merge or entangle the block model with unrelated domain concepts. Block schema
changes require explicit migration and versioning.

**Rationale**: The entire product value proposition rests on modular, retrievable content units.
Violating atomicity breaks search, filtering, and the core UX promise.

### II. Privacy by Default

User data MUST be private by default. No block, note, storage, task, profile, or account data
may be accessible to any user other than the owner without an explicit, deliberate action by the
owner. Backend queries MUST always scope data to the authenticated user. Zero data leaks between
users are a hard requirement — not a best effort.

**Rationale**: Security and trust are non-negotiable for a personal knowledge tool. A single
data leak destroys user confidence permanently.

### III. Simplicity Over Features

The MVP MUST NOT include: team workspaces, real-time editing, file uploads, notifications,
messaging, or recommendation algorithms. The confirmed MVP scope is: Blocks, Notes with
hierarchical Storages, and the Tasks todo list. Every feature added beyond this defined scope
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

### VII. Notes and Storage Hierarchy

Notes MUST live within a Storage. A Storage is a named container (analogous to a folder) that:
(a) can contain zero or more Notes, (b) can contain zero or more child Storages (nested
hierarchy of unlimited depth), and (c) belongs to exactly one owner. A Note belongs to exactly
one Storage and has a Title and Content. Users MUST be able to create, read, update, and delete
both Storages and Notes.

The Notes UI MUST provide exactly two views:
1. **Tree view** — a hierarchical folder/file browser displaying Storages and their nested
   Storages and Notes.
2. **Graph view** — a visual mindmap/graph representation of all Storages and Notes and their
   relationships (inspired by Obsidian's graph view), accessible as an alternative to the tree
   view.

No Note may exist outside of a Storage. The Graph view MUST reflect the live state of the
storage/note hierarchy.

**Rationale**: Hierarchical organization mirrors how users mentally group related ideas.
Two complementary views (tree and graph) serve different cognitive modes — sequential
browsing vs. spatial/relational exploration.

### VIII. Tasks System

Tasks are a first-class entity independent of Blocks. A Task represents a discrete action item
with two states: **active** (not yet completed) and **completed**. Users MUST be able to
create, read, update, delete, and mark tasks as completed via the dedicated Tasks page.

Blocks with type `task` MUST display a prominent action button that, when triggered, creates a
corresponding Task in the Tasks list. This is the only cross-domain bridge between Blocks and
Tasks — the Tasks domain MUST otherwise maintain its own data model and API, decoupled from
Blocks.

Blocks, Notes, and Tasks are each rendered on separate, dedicated pages. Navigation between
these three pages MUST be clear and consistent across the application.

**Rationale**: Capturing action items from content (blocks) into a unified todo list is a core
productivity loop. Keeping Tasks as a separate domain ensures the Blocks model remains atomic
and unentangled, and gives Tasks the space to evolve independently.

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

**Version**: 1.1.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-03-02
