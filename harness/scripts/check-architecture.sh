#!/usr/bin/env bash
# Verifica estrutura mínima do kit/projeto
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ISSUES=0

required=(
  "AGENTS.md"
  "specs/01-project-discovery.spec.md"
  "specs/12-validation.spec.md"
  ".cursor/rules/00-core-principles.mdc"
  "prompts/master-prompt.md"
  "harness/scripts/run-harness.sh"
)

for path in "${required[@]}"; do
  if [ ! -e "$ROOT/$path" ]; then
    echo "  VIOLAÇÃO: missing $path"
    ISSUES=$((ISSUES + 1))
  fi
done

# Se projeto implementado, verificar módulos
if [ -d "$ROOT/src/modules" ]; then
  for mod in "$ROOT/src/modules"/*; do
    [ -d "$mod" ] || continue
    for layer in domain application infrastructure presentation; do
      if [ ! -d "$mod/$layer" ]; then
        echo "  VIOLAÇÃO: $mod missing layer $layer"
        ISSUES=$((ISSUES + 1))
      fi
    done
  done
fi

if [ "$ISSUES" -gt 0 ]; then
  exit 1
fi

echo "  Architecture structure OK"
exit 0
