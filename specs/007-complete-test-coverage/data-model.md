# Data Model: Complete Test Coverage Audit

**Feature**: Complete Test Coverage Audit
**Date**: 2026-03-07

---

## Test Inventory Model

This document defines the structure for tracking test coverage across the codebase.

### Entity: TestableComponent

Represents any unit of code that requires testing.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (file path + method/component name) |
| name | string | Human-readable name of the component/method |
| type | ComponentType | Category: CONTROLLER, SERVICE, GUARD, DECORATOR, PAGE, COMPONENT, HOOK, API_CLIENT |
| filePath | string | Relative path from app root |
| app | AppType | BACKEND or FRONTEND |
| hasTest | boolean | Whether test file exists |
| testPath | string | Path to test file (if exists) |
| priority | Priority | P1 (critical), P2 (important), P3 (nice-to-have) |
| notes | string | Additional context about testing needs |

### Entity: TestCase

Represents an individual test scenario for a component.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| componentId | string | Reference to TestableComponent |
| description | string | What the test verifies |
| testType | TestType | UNIT, INTEGRATION, COMPONENT, E2E |
| status | TestStatus | MISSING, EXISTS, PLANNED |
| scenario | string | Given/When/Then description |

### Enum: ComponentType

```typescript
enum ComponentType {
  // Backend
  CONTROLLER = 'CONTROLLER',     // NestJS controllers
  SERVICE = 'SERVICE',           // NestJS services
  GUARD = 'GUARD',               // Auth guards
  DECORATOR = 'DECORATOR',       // Custom decorators
  MIDDLEWARE = 'MIDDLEWARE',     // Express middleware
  PIPE = 'PIPE',                 // Validation pipes

  // Frontend
  PAGE = 'PAGE',                 // Next.js pages
  COMPONENT = 'COMPONENT',       // React components
  HOOK = 'HOOK',                 // Custom React hooks
  UTIL = 'UTIL',                 // Utility functions
  API_CLIENT = 'API_CLIENT',     // API client functions
}
```

### Enum: TestType

```typescript
enum TestType {
  UNIT = 'UNIT',                 // Isolated unit tests
  INTEGRATION = 'INTEGRATION',   // Multi-component tests
  COMPONENT = 'COMPONENT',       // React component tests
  E2E = 'E2E',                   // End-to-end tests
}
```

---

## Backend Test Inventory

### Controllers (P1 - Critical)

| Component | File Path | Has Test | Test Path | Priority |
|-----------|-----------|----------|-----------|----------|
| AuthController | src/auth/auth.controller.ts | ✓ | src/auth/auth.controller.spec.ts | P1 |
| UsersController | src/users/users.controller.ts | ✓ | src/users/users.controller.spec.ts | P1 |
| BlockController | src/block/block.controller.ts | ✓ | src/block/block.controller.spec.ts | P1 |
| StorageController | src/storage/storage.controller.ts | ✓ | src/storage/storage.controller.spec.ts | P1 |
| NoteController | src/note/note.controller.ts | ✓ | src/note/note.controller.spec.ts | P1 |
| TodoController | src/todo/todo.controller.ts | ✓ | src/todo/todo.controller.spec.ts | P1 |
| AppController | src/app.controller.ts | ✓ | src/app.controller.spec.ts | P2 |

### Services (P1 - Critical)

| Component | File Path | Has Test | Test Path | Priority |
|-----------|-----------|----------|-----------|----------|
| AuthService | src/auth/auth.service.ts | ✓ | src/auth/auth.service.spec.ts | P1 |
| UsersService | src/users/users.service.ts | ✓ | src/users/users.service.spec.ts | P1 |
| BlockService | src/block/block.service.ts | ✓ | src/block/block.service.spec.ts | P1 |
| StorageService | src/storage/storage.service.ts | ✓ | src/storage/storage.service.spec.ts | P1 |
| NoteService | src/note/note.service.ts | ✓ | src/note/note.service.spec.ts | P1 |
| TodoService | src/todo/todo.service.ts | ✓ | src/todo/todo.service.spec.ts | P1 |
| PrismaService | src/prisma/prisma.service.ts | ✗ | N/A | P2 |

### Guards & Decorators (P2 - Important)

| Component | File Path | Has Test | Test Path | Priority |
|-----------|-----------|----------|-----------|----------|
| JwtAuthGuard | src/auth/guards/jwt-auth.guard.ts | ✗ | N/A | P2 |
| Public Decorator | src/auth/decorators/public.decorator.ts | ✗ | N/A | P3 |
| CurrentUser Decorator | src/auth/decorators/current-user.decorator.ts | ✗ | N/A | P3 |

### Configuration (P2 - Important)

| Component | File Path | Has Test | Test Path | Priority |
|-----------|-----------|----------|-----------|----------|
| Env Config | src/config/env.ts | ✓ | src/config/env.spec.ts | P2 |

---

## Frontend Test Inventory

### Pages (P1 - Critical)

| Component | File Path | Has Test | Test Path | Priority |
|-----------|-----------|----------|-----------|----------|
| LoginPage | src/pages-flat/login/ui/login-page.tsx | ✗ | N/A | P1 |
| RegisterPage | src/pages-flat/register/ui/register-page.tsx | ✗ | N/A | P1 |
| DashboardPage | src/pages-flat/dashboard/ui/dashboard-page.tsx | Partial | __tests__/blocks-client.test.tsx | P1 |
| ProfilePage | src/pages-flat/profile/ui/profile-page.tsx | Partial | src/features/update-profile/ui/__tests__/* | P1 |
| NotesPage | src/pages-flat/notes/ui/notes-page.tsx | ✓ | src/pages-flat/notes/ui/__tests__/notes-page.test.tsx | P1 |
| TodoPage | src/pages-flat/todo/ui/todo-page.tsx | ✗ | N/A | P1 |

### API Clients (P1 - Critical)

| Component | File Path | Has Test | Test Path | Priority |
|-----------|-----------|----------|-----------|----------|
| Auth API | src/shared/api/auth.api.ts | ✗ | N/A | P1 |
| Blocks API | src/shared/api/blocks.api.ts | Partial | __tests__/blocks-client.test.tsx | P1 |
| Storages API | src/shared/api/storages.api.ts | ✓ | src/shared/api/__tests__/storages.api.test.ts | P1 |
| Notes API | src/shared/api/notes.api.ts | ✓ | src/shared/api/__tests__/notes.api.test.ts | P1 |
| Todos API | src/shared/api/todos.api.ts | ✓ | src/shared/api/__tests__/todos.api.test.ts | P1 |

### E2E Tests (P1 - Critical User Flows)

| Flow | File Path | Has Test | Priority |
|------|-----------|----------|----------|
| Authentication | e2e/auth.spec.ts | ✓ | P1 |
| Block Lifecycle | e2e/block-lifecycle.spec.ts | ✓ | P1 |
| Profile Management | e2e/profile.spec.ts | ✓ | P1 |
| Notes Management | N/A | ✗ | P2 |
| Todo Management | N/A | ✗ | P2 |

---

## Test Case Templates

### Backend Controller Test Template

```typescript
describe('XxxController', () => {
  let controller: XxxController;
  let service: jest.Mocked<XxxService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [XxxController],
      providers: [
        { provide: XxxService, useValue: mockXxxService() }
      ]
    }).compile();

    controller = module.get(XxxController);
    service = module.get(XxxService);
  });

  describe('methodName', () => {
    it('should succeed when given valid input', async () => {});
    it('should return 404 when resource not found', async () => {});
    it('should return 422 when validation fails', async () => {});
  });
});
```

### Backend Service Test Template

```typescript
describe('XxxService', () => {
  let service: XxxService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        XxxService,
        { provide: PrismaService, useValue: mockPrisma() }
      ]
    }).compile();

    service = module.get(XxxService);
    prisma = module.get(PrismaService);
  });

  describe('methodName', () => {
    it('should return expected result when given valid input', async () => {});
    it('should throw NotFoundException when resource missing', async () => {});
    it('should throw ConflictException when duplicate', async () => {});
  });
});
```

### Frontend Component Test Template

```typescript
describe('XxxPage', () => {
  beforeEach(() => {
    // Reset mocks
  });

  it('should render initial state correctly', () => {
    render(<XxxPage />);
    // Assertions
  });

  it('should handle user interaction', async () => {
    render(<XxxPage />);
    // User events
    // Assertions
  });

  it('should display error state', () => {
    // Mock error condition
    render(<XxxPage />);
    // Assertions
  });
});
```

### Frontend API Client Test Template

```typescript
describe('xxxApi', () => {
  beforeEach(() => {
    // Reset fetch mock
  });

  it('should call correct endpoint with auth header', async () => {
    // Mock successful response
    // Call API function
    // Assert fetch called with correct args
  });

  it('should throw on error response', async () => {
    // Mock error response
    // Assert throws
  });
});
```

---

## Coverage Matrix Summary

### Backend Coverage

| Category | Total | Tested | Missing | Coverage % |
|----------|-------|--------|---------|------------|
| Controllers | 7 | 7 | 0 | 100% |
| Services | 7 | 6 | 1 | 86% |
| Guards | 1 | 0 | 1 | 0% |
| Decorators | 2 | 0 | 2 | 0% |
| **Backend Total** | **17** | **13** | **4** | **76%** |

### Frontend Coverage

| Category | Total | Tested | Missing | Coverage % |
|----------|-------|--------|---------|------------|
| Pages | 6 | 2 | 4 | 33% |
| API Clients | 5 | 3 | 2 | 60% |
| E2E Flows | 5 | 3 | 2 | 60% |
| **Frontend Total** | **16** | **8** | **8** | **50%** |

### Combined Coverage

| Total Components | Tested | Missing | Overall % |
|------------------|--------|---------|-----------|
| 33 | 21 | 12 | 64% |

**Target**: 100% of P1 components (P1 total: 24, P1 missing: 7)
