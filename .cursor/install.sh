#!/usr/bin/env bash
# Idempotent bootstrap for the AI TCM community health management SaaS.
# Installs backend + frontend dependencies, generates the Prisma client,
# applies the SQLite schema, and seeds demo data. Safe to run repeatedly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Installing backend dependencies"
cd "$ROOT/backend"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Generating Prisma client and applying schema (SQLite)"
npx prisma generate
npx prisma db push --skip-generate

echo "==> Seeding demo data (idempotent)"
npm run db:seed

echo "==> Installing frontend dependencies"
cd "$ROOT/frontend"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "==> Install complete"
