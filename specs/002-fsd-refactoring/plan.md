# Implementation Plan: FSD Architecture Refactoring

**Branch**: `002-fsd-refactoring` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-fsd-refactoring/spec.md`

## Summary

Refactor the `apps/web` codebase from a flat component structure to Feature-Sliced Design (FSD). This involves creating consistent layers (`shared`, `entities`, `features`, `widgets`, `pages`, `app`) within a new `src/` directory, extracting domain logic (Blocks, Users), and re-composing the UI into meaningful features and widgets.

## Technical Context

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9
- **Existing Structure**: `components/`, `lib/`, `app/` (routing + components)
- **Target Structure**: FSD layers in `src/`, minimal routing in `app/`

## Implementation Phases

### Phase 0: Preparation

1. Create directory structure for FSD layers in `apps/web/src`.
2. Update `tsconfig.json` to include `@/*` paths mapping to `src/*`.

### Phase 1: Shared Layer

1. Move `components/ui/*` to `src/shared/ui/`.
2. Move utils and tag colors to `src/shared/lib/`.
3. Create public APIs (index.ts) for shared components.

### Phase 2: Entities Layer

1. **Block Entity**: Move `block-card.tsx` to `src/entities/block/ui/`. Move block-related types to `src/entities/block/model/types.ts`.
2. **User Entity**: Move user-related types to `src/entities/user/model/types.ts`.
3. Create public APIs for entities.

### Phase 3: Features Layer

1. **Create Block**: Move `create-block-dialog.tsx` to `src/features/create-block/ui/`.
2. **Auth**: Move `login-form.tsx` and `logout-button.tsx` to `src/features/auth/ui/`.
3. **Profile**: Move `profile-form.tsx` to `src/features/update-profile/ui/`.
4. Create public APIs for features.

### Phase 4: Widgets Layer

1. **Navbar**: Move `navbar.tsx` and `profile-navbar.tsx` to `src/widgets/navbar/ui/`.
2. **Blocks List**: Move `blocks-client.tsx` to `src/widgets/blocks-list/ui/`.
3. Create public APIs for widgets.

### Phase 5: Pages Layer

1. Create `src/pages-flat/dashboard/`, `src/pages-flat/profile/`, `src/pages-flat/login/`.
2. Move the main logic from `app/dashboard/page.tsx`, `app/profile/page.tsx`, etc., to these FSD pages.
3. Update `app/` routes to simply import and render the FSD pages.

### Phase 6: Finalization & Cleanup

1. Delete old `components/` and `lib/` directories.
2. Verify all imports and fix broken paths.
3. Run tests and build to ensure no regressions.

## Project Structure (Target)

```text
apps/web/
├── app/                  # Next.js App Router (Routing only)
├── src/
│   ├── app/              # FSD App Layer (Providers, Styles)
│   ├── pages-flat/       # FSD Pages Layer
│   ├── widgets/          # FSD Widgets Layer
│   ├── features/         # FSD Features Layer
│   ├── entities/         # FSD Entities Layer
│   └── shared/           # FSD Shared Layer
├── package.json
└── tsconfig.json
```

## Complexity Tracking

- **Relocation**: High. Moving almost all files.
- **Dependency Paths**: Medium. Updating imports across the project.
- **Next.js Integration**: Medium. Ensuring App Router metadata and hooks work correctly after moving logic.

## Verdict

The plan follows FSD strictly while maintaining Next.js compatibility. The use of a `src/` directory and public APIs at each slice will enforce better architectural discipline.
