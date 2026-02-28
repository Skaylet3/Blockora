# Quickstart: Frontend–Backend API Integration

**Feature**: 001-frontend-api-integration
**Date**: 2026-02-28

---

## Prerequisites

- Node 18+ installed
- Yarn 1.22 installed
- Access to the Turbo monorepo

---

## Environment Setup

1. Create `apps/web/.env.local` with the following:

```bash
NEXT_PUBLIC_API_BASE_URL=https://blockora-api.vercel.app/api
```

2. Verify the API is reachable:

```bash
curl https://blockora-api.vercel.app/api/docs
# Should return the Swagger UI HTML
```

---

## Running the Frontend

```bash
# From repo root
yarn dev --filter=web

# Or from apps/web
cd apps/web && yarn dev
```

The app runs at `http://localhost:3000`.

---

## Register a Test Account

1. Navigate to `http://localhost:3000/register`
2. Enter a valid email and a password (min 8 characters)
3. Submit — you should be redirected to the dashboard

---

## Running Tests

```bash
# Unit + component tests
cd apps/web && yarn test

# E2E tests (requires running dev server)
cd apps/web && yarn test:e2e
```

---

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Dashboard (protected — redirects to `/login` if no session) |
| `/login` | Login page (redirects to `/` if already signed in) |
| `/register` | Register page (redirects to `/` if already signed in) |
| `/profile` | Profile page (protected) |

---

## API Reference

Full endpoint documentation is available at:
`https://blockora-api.vercel.app/api/docs`

Local API contracts: [contracts/api.md](./contracts/api.md)
