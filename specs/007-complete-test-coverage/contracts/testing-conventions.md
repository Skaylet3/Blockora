# Testing Conventions Contract

**Feature**: Complete Test Coverage Audit
**Date**: 2026-03-07

---

## Contract: Backend Testing

### File Location Convention

```
src/{feature}/
├── {feature}.controller.ts
├── {feature}.controller.spec.ts    # Must exist
├── {feature}.service.ts
├── {feature}.service.spec.ts       # Must exist
└── dto/
    └── *.dto.ts                    # No separate tests (validated via controller tests)
```

### Test Structure Convention

```typescript
// Controller test pattern
describe('FeatureController', () => {
  let controller: FeatureController;
  let service: jest.Mocked<FeatureService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FeatureController],
      providers: [
        { provide: FeatureService, useValue: createMockService() }
      ]
    }).compile();

    controller = module.get(FeatureController);
    service = module.get(FeatureService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should return X when given valid Y', async () => {});
    it('should throw NotFoundException when Z', async () => {});
  });
});
```

### Mock Standards

**PrismaService Mock**:
```typescript
const mockPrisma = () => ({
  db: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    block: { findMany: jest.fn(), findUnique: jest.fn() },
    // ... other models
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
});
```

**Service Mock**:
```typescript
const mockService = () => ({
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});
```

### Required Test Cases Per Endpoint

| Endpoint Type | Required Tests |
|---------------|----------------|
| GET /resource | Returns array, returns filtered results, handles empty |
| GET /resource/:id | Returns item, 404 when not found, 401 when unauthorized |
| POST /resource | Creates item, 422 on validation error, 409 on conflict |
| PATCH /resource/:id | Updates item, 404 when not found, 422 on validation error |
| DELETE /resource/:id | Deletes item, 404 when not found |

---

## Contract: Frontend Testing

### File Location Convention

```
// Option 1: Co-located __tests__ directory
src/{feature}/
├── ui/
│   ├── component.tsx
│   └── __tests__/
│       └── component.test.tsx

// Option 2: Root __tests__ directory
__tests__/
└── component.test.tsx

// Option 3: Shared API tests
src/shared/api/__tests__/
└── api-name.test.ts
```

### Test Structure Convention

```typescript
// Component test pattern
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks();
  });

  it('renders initial state correctly', () => {
    render(<ComponentName />);
    // Query and assert
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<ComponentName />);
    // Interact and assert
  });

  it('displays error state', () => {
    // Setup error condition
    render(<ComponentName />);
    // Assert error display
  });

  it('displays loading state', () => {
    // Setup loading condition
    render(<ComponentName />);
    // Assert loading display
  });
});
```

### Mock Standards

**API Client Mock**:
```typescript
// Mock fetch globally
global.fetch = jest.fn();

beforeEach(() => {
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'mocked' }),
  });
});
```

**Router Mock** (if needed):
```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  usePathname: () => '/current-path',
}));
```

### Required Test Cases Per Component Type

| Component Type | Required Tests |
|----------------|----------------|
| Page | Renders without error, displays data, handles empty state, handles error state |
| Form | Validates input, submits correctly, displays errors, handles loading |
| List | Renders items, handles empty, handles pagination if applicable |
| Dialog | Opens/closes correctly, renders content, handles actions |

---

## Contract: E2E Testing

### File Location Convention

```
e2e/
└── {feature-flow}.spec.ts
```

### Test Structure Convention

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login, seed data, etc.
  });

  test('complete user journey', async ({ page }) => {
    // Step-by-step user actions
    // Assertions after each significant step
  });
});
```

### Required Test Cases Per Flow

| Flow Type | Required Tests |
|-----------|----------------|
| Auth | Login success, login failure, logout, session persistence |
| CRUD | Create, read, update, delete operations |
| Navigation | Page transitions, back button, deep linking |

---

## Contract: Test Execution

### Commands

```bash
# Backend tests
cd apps/api && npm test              # Unit/integration tests
cd apps/api && npm run test:e2e      # E2E tests

# Frontend tests
cd apps/web && npm test              # Component tests
cd apps/web && npm run test:e2e      # E2E tests

# With coverage
cd apps/api && npx vitest run --coverage
cd apps/web && npx vitest run --coverage

# All tests (from root)
npm test  # If configured in turbo.json
```

### CI Requirements

- All tests must pass before merge
- Coverage reports generated and archived
- No test failures allowed (flaky tests must be fixed)

---

## Contract: Naming Conventions

### Test File Names

| Type | Pattern | Example |
|------|---------|---------|
| Backend Unit | `*.spec.ts` | `auth.service.spec.ts` |
| Frontend Component | `*.test.tsx` | `login-page.test.tsx` |
| Frontend Utils | `*.test.ts` | `api-client.test.ts` |
| E2E | `*.spec.ts` | `auth-flow.spec.ts` |

### Test Description Conventions

```typescript
// Use descriptive, behavior-focused language
describe('AuthService', () => {
  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {});
    it('should throw UnauthorizedException when password is incorrect', async () => {});
    it('should throw UnauthorizedException when user does not exist', async () => {});
  });
});
```

---

## Enforcement

These conventions are enforced via:
1. Code review checklist
2. CI test execution
3. `npm run lint` (if test linting configured)
