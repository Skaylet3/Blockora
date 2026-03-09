# Quickstart: Complete Test Coverage Audit

**Feature**: Complete Test Coverage Audit
**Date**: 2026-03-07

---

## Prerequisites

```bash
# Ensure you're on the correct branch
git checkout 007-complete-test-coverage

# Install dependencies
yarn install

# Verify existing tests pass
cd apps/api && npm test
cd apps/web && npm test
```

---

## Running Tests

### Backend (apps/api)

```bash
cd apps/api

# Run all unit/integration tests
npm test

# Run with coverage
npx vitest run --coverage

# Run specific test file
npx vitest run src/auth/auth.service.spec.ts

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npx playwright test --ui
```

### Frontend (apps/web)

```bash
cd apps/web

# Run all component tests
npm test

# Run with coverage
npx vitest run --coverage

# Run specific test file
npx vitest run __tests__/create-block-dialog.test.tsx

# Run E2E tests
npm run test:e2e

# Run E2E with UI
npx playwright test --ui
```

---

## Test Development Workflow

### 1. Identify Missing Tests

Refer to [data-model.md](data-model.md) for the complete inventory of:
- Backend controllers and services
- Frontend pages and components
- API clients
- E2E flows

### 2. Create Test File

Follow the naming conventions in [contracts/testing-conventions.md](contracts/testing-conventions.md):

```bash
# Backend example
touch apps/api/src/prisma/prisma.service.spec.ts

# Frontend example
touch apps/web/src/pages-flat/todo/ui/__tests__/todo-page.test.tsx
```

### 3. Write Tests

Use the templates from [data-model.md](data-model.md):
- Backend Controller Test Template
- Backend Service Test Template
- Frontend Component Test Template
- Frontend API Client Test Template

### 4. Run and Debug

```bash
# Watch mode for rapid iteration
npx vitest --watch

# Run specific test by name
npx vitest run -t "should return tokens"

# Debug with console logs
DEBUG=true npx vitest run
```

### 5. Verify Coverage

```bash
# Generate coverage report
npx vitest run --coverage

# Open HTML report
open ../coverage/index.html
```

---

## Key Testing Patterns

### Backend: Mocking PrismaService

```typescript
const mockPrisma = () => ({
  db: {
    user: { findUnique: jest.fn(), create: jest.fn() },
    block: { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn() },
    refreshToken: { create: jest.fn(), deleteMany: jest.fn() },
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
});
```

### Backend: Mocking Services in Controllers

```typescript
const module = await Test.createTestingModule({
  controllers: [FeatureController],
  providers: [
    { provide: FeatureService, useValue: {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    }}
  ]
}).compile();
```

### Frontend: Mocking fetch

```typescript
// In test setup or beforeEach
global.fetch = jest.fn();

(fetch as jest.Mock).mockResolvedValue({
  ok: true,
  json: async () => ({ data: [] }),
});
```

### Frontend: Testing with User Events

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const user = userEvent.setup();
render(<Component />);

await user.click(screen.getByRole('button', { name: /submit/i }));
await user.type(screen.getByLabelText(/email/i), 'test@example.com');
```

---

## Common Issues and Solutions

### Issue: "Cannot find module '@/...'"

**Solution**: Vitest config already has path aliases configured. If running into issues:

```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

### Issue: Decorator metadata not working

**Solution**: Backend uses `unplugin-swc` for decorator support. Ensure it's configured in `vitest.config.ts`.

### Issue: Database connections in tests

**Solution**: Never connect to real database. Always mock PrismaService:

```typescript
{ provide: PrismaService, useValue: mockPrisma() }
```

### Issue: JWT token validation failing

**Solution**: For unit tests, mock the guard. For E2E tests, use real JWT tokens:

```typescript
// Unit test - mock guard
.overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })

// E2E test - real token
const token = jwtService.sign({ sub: userId, email }, { secret: process.env.JWT_SECRET });
```

---

## Coverage Requirements

| Category | Target | Current | Gap |
|----------|--------|---------|-----|
| Backend Controllers | 100% | 100% | 0 |
| Backend Services | 100% | 86% | 1 service |
| Backend Guards | 100% | 0% | 1 guard |
| Frontend Pages | 100% | 33% | 4 pages |
| Frontend API Clients | 100% | 60% | 2 clients |

---

## Next Steps

1. Review [data-model.md](data-model.md) for complete inventory
2. Pick a P1 (critical) component to test first
3. Follow the test templates in [contracts/testing-conventions.md](contracts/testing-conventions.md)
4. Run tests with coverage to verify
5. Mark component as tested in the data model
