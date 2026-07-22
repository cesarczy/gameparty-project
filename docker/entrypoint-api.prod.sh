#!/bin/sh
set -eu

echo "→ Aplicando migrations…"
npx prisma migrate deploy

if [ "${RUN_SEED:-false}" = "true" ]; then
  echo "→ Executando seed (RUN_SEED=true)…"
  npx tsx prisma/seed.ts || true
fi

echo "→ Iniciando API…"
exec npm run start
