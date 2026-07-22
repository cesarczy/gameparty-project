#!/usr/bin/env bash
# Verifica imports proibidos no domain
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FORBIDDEN='@prisma/client|from ['\''"]express|from ['\''"]fastify|from ['\''"]react|from ['\''"]next'

VIOLATIONS=0

DOMAIN_DIRS=$(find "$ROOT/src" -type d -name domain 2>/dev/null || true)

if [ -z "$DOMAIN_DIRS" ]; then
  echo "  (sem pastas domain — OK para kit scaffold)"
  exit 0
fi

while IFS= read -r dir; do
  if rg -l "$FORBIDDEN" "$dir" --glob '*.ts' --glob '*.tsx' 2>/dev/null; then
    echo "  VIOLAÇÃO: import proibido em $dir"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done <<< "$DOMAIN_DIRS"

# Domain não deve importar infrastructure
while IFS= read -r dir; do
  if rg -l "from ['\"].*infrastructure" "$dir" --glob '*.ts' 2>/dev/null; then
    echo "  VIOLAÇÃO: domain importa infrastructure em $dir"
    VIOLATIONS=$((VIOLATIONS + 1))
  fi
done <<< "$DOMAIN_DIRS"

if [ "$VIOLATIONS" -gt 0 ]; then
  exit 1
fi

echo "  Layer dependencies OK"
exit 0
