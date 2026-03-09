# Quickstart: Cloudflare Turnstile CAPTCHA Integration

## Prerequisites

1. A Cloudflare account with a Turnstile site configured
2. Site key and secret key from the Cloudflare dashboard

## Environment Setup

### Backend (`apps/api/.env`)
```
TURNSTILE_SECRET_KEY=your-secret-key-here
```

### Frontend (`apps/web/.env.local`)
```
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
```

### Testing
Use Cloudflare's test keys for local development and CI:
- **Site key (always passes)**: `1x00000000000000000000AA`
- **Secret key (always passes)**: `1x0000000000000000000000000000000AA`
- **Site key (always blocks)**: `2x00000000000000000000AB`
- **Secret key (always fails)**: `2x0000000000000000000000000000000AA`

## Verification

1. Start the backend: `cd apps/api && yarn dev`
2. Start the frontend: `cd apps/web && yarn dev`
3. Navigate to `/register` — Turnstile widget should appear
4. Complete registration — should succeed with valid CAPTCHA
5. Run tests: `cd apps/api && yarn test` and `cd apps/web && yarn test`

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/captcha/turnstile.service.ts` | Backend CAPTCHA verification service |
| `apps/api/src/captcha/captcha.module.ts` | NestJS module exporting TurnstileService |
| `apps/api/src/auth/dto/register.dto.ts` | Updated with `captchaToken` field |
| `apps/api/src/auth/dto/login.dto.ts` | Updated with `captchaToken` field |
| `apps/api/src/auth/dto/refresh.dto.ts` | Updated with `captchaToken` field |
| `apps/api/src/auth/auth.service.ts` | Calls TurnstileService before processing |
| `apps/api/src/config/env.ts` | `TURNSTILE_SECRET_KEY` validation |
| `apps/web/src/features/auth/ui/login-form.tsx` | Turnstile widget on login |
| `apps/web/src/features/auth/ui/register-form.tsx` | Turnstile widget on register |
| `apps/web/src/shared/api/auth.api.ts` | Updated request types |
| `apps/web/src/shared/api/http-client.ts` | Refresh flow sends captchaToken |
