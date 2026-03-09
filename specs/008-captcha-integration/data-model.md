# Data Model: Cloudflare Turnstile CAPTCHA Integration

## Overview

No new database entities required. CAPTCHA verification is stateless — tokens are verified against Cloudflare's API in real-time and discarded. No persistent storage of CAPTCHA tokens or verification results.

## Modified Entities

### RegisterDto (request)

| Field        | Type   | Required | Validation                                   |
|-------------|--------|----------|----------------------------------------------|
| email       | string | yes      | valid email format                           |
| password    | string | yes      | min 8 chars, uppercase, lowercase, number    |
| displayName | string | no       | optional display name                        |
| captchaToken| string | yes      | non-empty string, verified via Cloudflare API |

### LoginDto (request)

| Field        | Type   | Required | Validation                                   |
|-------------|--------|----------|----------------------------------------------|
| email       | string | yes      | valid email format                           |
| password    | string | yes      | non-empty                                    |
| captchaToken| string | yes      | non-empty string, verified via Cloudflare API |

### RefreshDto (request)

| Field        | Type   | Required | Validation                                   |
|-------------|--------|----------|----------------------------------------------|
| refreshToken| string | yes      | non-empty                                    |
| captchaToken| string | yes      | non-empty string, verified via Cloudflare API |

## External Data: Turnstile Siteverify Response

Cloudflare returns the following from `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`:

| Field          | Type     | Description                              |
|---------------|----------|------------------------------------------|
| success       | boolean  | whether verification passed              |
| error-codes   | string[] | error codes if failed                    |
| challenge_ts  | string   | ISO timestamp of challenge               |
| hostname      | string   | hostname where widget was rendered       |

Only `success` is used for the pass/fail decision.

## Configuration

| Variable                         | Location  | Required | Description                    |
|---------------------------------|-----------|----------|--------------------------------|
| TURNSTILE_SECRET_KEY            | Backend   | yes      | Server-side verification key   |
| NEXT_PUBLIC_TURNSTILE_SITE_KEY  | Frontend  | yes      | Client-side widget render key  |
