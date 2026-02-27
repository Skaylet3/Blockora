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

cleanup() {
  "${COMPOSE_CMD[@]}" -f docker-compose.test.yml down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Starting integration database..."
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

echo "Building backend sources for integration tests..."
yarn tsc -p tsconfig.build.json --noEmitOnError false || true

echo "Running integration tests with Vitest..."
yarn vitest run --config vitest.int.config.ts
