#!/bin/sh
set -e

echo "→ Dependências..."
npm install

echo "→ Gerando Prisma Client..."
npx prisma generate

echo "→ Aplicando migrations..."
npx prisma migrate deploy

echo "→ Seed (idempotente)..."
npx tsx prisma/seed.ts || true

echo "→ Iniciando API..."
exec npm run dev
