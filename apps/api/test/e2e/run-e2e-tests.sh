#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

set -a
source ./.env.test
set +a

if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD=(docker-compose)
else
  echo "Docker Compose is not installed."
  exit 1
fi

APP_PID=""
cleanup() {
  if [[ -n "$APP_PID" ]] && kill -0 "$APP_PID" >/dev/null 2>&1; then
    kill "$APP_PID" >/dev/null 2>&1 || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  "${COMPOSE_CMD[@]}" -f docker-compose.test.yml down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Starting e2e database..."
"${COMPOSE_CMD[@]}" -f docker-compose.test.yml up -d postgres_test

echo "Waiting for Postgres to become ready..."
ready=0
for _ in {1..60}; do
  if "${COMPOSE_CMD[@]}" -f docker-compose.test.yml exec -T postgres_test pg_isready -U test -d app_test >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 1
done

if [[ "$ready" -ne 1 ]]; then
  echo "Postgres did not become ready in time."
  exit 1
fi

echo "Applying Prisma migrations..."
yarn prisma migrate deploy

echo "Starting Nest dev app on localhost:${PORT}..."
yarn ts-node -r tsconfig-paths/register src/main.ts > /tmp/api-e2e-app.log 2>&1 &
APP_PID=$!

echo "Waiting for dev app to be reachable..."
app_ready=0
for _ in {1..90}; do
  if curl -sSf "http://localhost:${PORT}/" >/dev/null 2>&1; then
    app_ready=1
    break
  fi
  sleep 1
done

if [[ "$app_ready" -ne 1 ]]; then
  echo "Dev app did not become ready in time."
  echo "Last app logs:"
  tail -n 200 /tmp/api-e2e-app.log || true
  exit 1
fi

export E2E_BASE_URL="http://localhost:${PORT}"

echo "Running e2e tests against ${E2E_BASE_URL} ..."
yarn playwright test -c playwright.config.ts
