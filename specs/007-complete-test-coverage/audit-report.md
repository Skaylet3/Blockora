# Test Coverage Audit Report

**Feature**: Complete Test Coverage Audit
**Date**: 2026-03-07
**Branch**: `007-complete-test-coverage`

---

## Summary

| Metric | Before | After |
|--------|--------|-------|
| Backend test files | 14 | 18 |
| Backend tests | 90 | 119 |
| Frontend test files | 7 | 14 |
| Frontend tests | 40 | 114 |
| **Total tests** | **130** | **233** |

---

## Backend Coverage (apps/api)

### Controllers (18 files, 119 tests)

| Component | File | Test File | Tests | Status |
|-----------|------|-----------|-------|--------|
| AppController | src/app.controller.ts | src/app.controller.spec.ts | 1 | Tested |
| AuthController | src/auth/auth.controller.ts | src/auth/auth.controller.spec.ts | 10 | Tested |
| BlockController | src/block/block.controller.ts | src/block/block.controller.spec.ts | 6 | Tested |
| UsersController | src/users/users.controller.ts | src/users/users.controller.spec.ts | 2 | Tested |
| StorageController | src/storage/storage.controller.ts | src/storage/storage.controller.spec.ts | 4 | Tested |
| NoteController | src/note/note.controller.ts | src/note/note.controller.spec.ts | 7 | Tested |
| TodoController | src/todo/todo.controller.ts | src/todo/todo.controller.spec.ts | 8 | Tested |

### Services

| Component | File | Test File | Tests | Status |
|-----------|------|-----------|-------|--------|
| AuthService | src/auth/auth.service.ts | src/auth/auth.service.spec.ts | 13 | Tested |
| BlockService | src/block/block.service.ts | src/block/block.service.spec.ts | 8 | Tested |
| UsersService | src/users/users.service.ts | src/users/users.service.spec.ts | 6 | Tested |
| StorageService | src/storage/storage.service.ts | src/storage/storage.service.spec.ts | 6 | Tested |
| NoteService | src/note/note.service.ts | src/note/note.service.spec.ts | 10 | Tested |
| TodoService | src/todo/todo.service.ts | src/todo/todo.service.spec.ts | 16 | Tested |
| PrismaService | src/prisma/prisma.service.ts | src/prisma/prisma.service.spec.ts | 3 | NEW |

### Guards & Decorators

| Component | File | Test File | Tests | Status |
|-----------|------|-----------|-------|--------|
| JwtAuthGuard | src/auth/guards/jwt-auth.guard.ts | src/auth/guards/jwt-auth.guard.spec.ts | 6 | NEW |
| Public Decorator | src/auth/decorators/public.decorator.ts | src/auth/decorators/public.decorator.spec.ts | 2 | NEW |
| CurrentUser Decorator | src/auth/decorators/current-user.decorator.ts | src/auth/decorators/current-user.decorator.spec.ts | 2 | NEW |

### Configuration

| Component | File | Test File | Tests | Status |
|-----------|------|-----------|-------|--------|
| Env Config | src/config/env.ts | src/config/env.spec.ts | 9 | Tested |

---

## Frontend Coverage (apps/web)

### Page Components (14 files, 114 tests)

| Component | File | Test File | Tests | Status |
|-----------|------|-----------|-------|--------|
| LoginPage | src/pages-flat/login/ui/login-page.tsx | src/pages-flat/login/ui/__tests__/login-page.test.tsx | 6 | NEW |
| RegisterPage | src/pages-flat/register/ui/register-page.tsx | src/pages-flat/register/ui/__tests__/register-page.test.tsx | 7 | NEW |
| DashboardPage | src/pages-flat/dashboard/ui/dashboard-page.tsx | src/pages-flat/dashboard/ui/__tests__/dashboard-page.test.tsx | 2 | NEW |
| ProfilePage | src/pages-flat/profile/ui/profile-page.tsx | src/pages-flat/profile/ui/__tests__/profile-page.test.tsx | 2 | NEW |
| NotesPage | src/pages-flat/notes/ui/notes-page.tsx | src/pages-flat/notes/ui/__tests__/notes-page.test.tsx | 7 | Tested (augmented) |
| TodoPage | src/pages-flat/todo/ui/todo-page.tsx | src/pages-flat/todo/ui/__tests__/todo-page.test.tsx | 9 | NEW |

### Feature Components

| Component | File | Test File | Tests | Status |
|-----------|------|-----------|-------|--------|
| ProfileForm | src/features/update-profile/ui/profile-form.tsx | src/features/update-profile/ui/__tests__/profile-form.test.tsx | 10 | Tested (augmented) |
| BlocksClient | src/widgets/blocks-list/ | __tests__/blocks-client.test.tsx | 9 | Tested (augmented) |
| CreateBlockDialog | src/widgets/ | __tests__/create-block-dialog.test.tsx | 11 | Tested (augmented) |

### API Clients

| Component | File | Test File | Tests | Status |
|-----------|------|-----------|-------|--------|
| Auth API | src/shared/api/auth.api.ts | src/shared/api/__tests__/auth.api.test.ts | 7 | NEW |
| Blocks API | src/shared/api/blocks.api.ts | src/shared/api/__tests__/blocks.api.test.ts | 8 | NEW |
| Storages API | src/shared/api/storages.api.ts | src/shared/api/__tests__/storages.api.test.ts | 8 | Tested (augmented) |
| Notes API | src/shared/api/notes.api.ts | src/shared/api/__tests__/notes.api.test.ts | 11 | Tested (augmented) |
| Todos API | src/shared/api/todos.api.ts | src/shared/api/__tests__/todos.api.test.ts | 17 | Tested (augmented) |

---

## New Tests Added

### Backend (29 new tests)

| Area | Tests Added | Details |
|------|-------------|---------|
| JwtAuthGuard | 6 | Valid token, missing header, non-Bearer, invalid token, @Public bypass, reflector check |
| Public Decorator | 2 | Metadata set, IS_PUBLIC_KEY value |
| CurrentUser Decorator | 2 | User extraction, undefined when no user |
| PrismaService | 3 | Defined, db accessor, $disconnect on destroy |
| Auth Controller | 5 | Error paths for register, login, refresh, logout, me |
| Auth Service | 3 | displayName passthrough, deleted user edge case, hash mismatch |
| Block Controller | 1 | NotFoundException propagation |
| Block Service | 2 | Update/remove NotFoundException |
| Users Controller | 1 | Error propagation |
| Note Controller | 1 | Storage not found propagation |
| Note Service | 1 | Update NotFoundException |
| Storage Controller | 1 | Remove NotFoundException |
| Todo Service | 1 | Empty content → undefined description |

### Frontend (74 new tests)

| Area | Tests Added | Details |
|------|-------------|---------|
| LoginPage | 6 | Render, form validation, success/error/loading states |
| RegisterPage | 7 | Render, validation, success/error/loading, 409 conflict |
| DashboardPage | 2 | Render with blocks, empty state |
| ProfilePage | 2 | Render with props, empty strings |
| TodoPage | 9 | Render, data display, empty/error states, filter, toggle, delete |
| Auth API | 7 | All 6 endpoints + displayName variant |
| Blocks API | 8 | All CRUD + promoteToTodo |
| Existing tests augmented | 33 | Additional edge cases across 7 existing test files |

---

## Coverage Thresholds

Coverage thresholds have been configured in both vitest configs:

| Metric | Threshold |
|--------|-----------|
| Statements | 80% |
| Branches | 70% |
| Functions | 80% |
| Lines | 80% |

---

## Test Execution Time

| App | Files | Tests | Duration |
|-----|-------|-------|----------|
| Backend | 18 | 119 | ~9s |
| Frontend | 14 | 114 | ~4s |
| **Total** | **32** | **233** | **~13s** |

Well within the 5-minute target.
