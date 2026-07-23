#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ ! -d "$ROOT/src" ]; then
  echo "  (sem src — OK)"
  exit 0
fi

VIOLATIONS=0

while IFS= read -r file; do
  if echo "$file" | grep -qE 'infrastructure|/prisma/'; then
    continue
  fi
  if echo "$file" | grep -q 'prisma/schema'; then
    continue
  fi
  echo "  VIOLAÇÃO: @prisma/client em $file (fora de infrastructure)"
  VIOLATIONS=$((VIOLATIONS + 1))
done < <(rg -l '@prisma/client' "$ROOT/src" --glob '*.ts' 2>/dev/null || true)

if [ -f "$ROOT/prisma/schema.prisma" ]; then
  if command -v npx &>/dev/null && [ -f "$ROOT/package.json" ]; then
    (cd "$ROOT" && npx prisma validate 2>/dev/null) && echo "  prisma validate OK" || {
      echo "  VIOLAÇÃO: prisma validate failed"
      VIOLATIONS=$((VIOLATIONS + 1))
    }
  else
    echo "  prisma/schema.prisma presente (validate skipped — sem package.json)"
  fi
fi

if [ "$VIOLATIONS" -gt 0 ]; then
  exit 1
fi

echo "  Prisma isolation OK"
exit 0
