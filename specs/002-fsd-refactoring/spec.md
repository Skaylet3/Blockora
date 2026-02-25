# Feature Specification: FSD Architecture Refactoring

**Feature Branch**: `002-fsd-refactoring`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "we need to make the frontend's architecture of this project fsd, we need to composite what we already have into nextjs compatible feature sliced design, also consider extracting entities and so on"

---

## User Scenarios & Goals _(mandatory)_

### Goal 1 - Clear Separation of Concerns (Priority: P1)

Move the current flat component structure into a hierarchical, standard FSD structure to improve maintainability and scalability.

**Acceptance Scenarios**:

1. **Given** a developer looking at the project, **When** they open the `src` directory, **Then** they see standard FSD layers: `app`, `pages`, `widgets`, `features`, `entities`, `shared`.
2. **Given** the new structure, **When** imports are analyzed, **Then** there are no circular dependencies and layers only import from lower layers (Shared <- Entities <- Features <- Widgets <- Pages <- App).

---

### Goal 2 - Entity Extraction (Priority: P2)

Identify and extract core domain entities (like `Block`, `User`) into the `entities` layer, including their UI components, types, and potentially hooks.

**Acceptance Scenarios**:

1. **Given** the `Block` entity, **When** refactored, **Then** `block-card.tsx` and related types are moved to `entities/block/`.
2. **Given** the `User` entity, **When** refactored, **Then** user-related types and state are moved to `entities/user/`.

---

### Goal 3 - Feature & Widget Composition (Priority: P2)

Decompose complex components into `features` (user actions) and `widgets` (standalone UI blocks).

**Acceptance Scenarios**:

1. **Given** the `create-block-dialog.tsx`, **When** refactored, **Then** it is moved to `features/create-block/`.
2. **Given** the dashboard list and filters, **When** refactored, **Then** they are composed in `widgets/blocks-list/`.
3. **Given** the navigation bars, **When** refactored, **Then** they are moved to `widgets/navbar/`.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Implement FSD architectural layers: `shared`, `entities`, `features`, `widgets`, `pages`, `app`.
- **FR-002**: Move UI kit (`components/ui`) to `shared/ui`.
- **FR-003**: Extract `Block` entity to `entities/block` containing its card and types.
- **FR-004**: Extract `User` entity to `entities/user` containing session/profile types.
- **FR-005**: Move user actions (`login-form`, `logout-button`, `create-block-dialog`) to `features`.
- **FR-006**: Move layout compositions (`navbar`, `profile-navbar`, dashboard list) to `widgets`.
- **FR-007**: Ensure Next.js App Router compatibility by keeping `app/` for routing but delegating logic to `pages/`.
- **FR-008**: Resolve all import paths to use the new directory structure.
- **FR-009**: The application MUST remain fully functional after refactoring.

### Key Entities

- **Shared**: The base layer containing reusable UI components, utils, and assets with no business logic.
- **Entities**: Domain-specific objects (e.g., Block, User) with their types and atomic UI.
- **Features**: User interactions that bring business value (e.g., Creating a Block, Logging in).
- **Widgets**: Compositional layer that combines features and entities into meaningful UI sections (e.g., Dashboard list).
- **Pages**: Full page compositions that correspond to routes.
- **App**: Global initialization, providers, and styles.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of files currently in `components/` and `lib/` are moved to their respective FSD layers.
- **SC-002**: The project builds successfully with no TypeScript errors.
- **SC-003**: All existing E2E and integration tests pass (referencing `001-ui-test-coverage`).
- **SC-004**: Import graph follows the FSD unidirectional dependency rule.
- **SC-005**: All entry points in `app/` (Next.js) are minimal and delegate to the `pages` layer.

### Assumptions

- Next.js App Router is used, so the `app` directory in the root will continue to be used for routing, but we will internalize most logic into `src/` (or similar).
- We will use absolute imports (e.g., `@/shared/ui/button`) to keep the structure clean.
