#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pick_compose() {
  if command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1 && docker info &>/dev/null 2>&1; then
    echo "docker compose"
    return
  fi
  if podman compose version &>/dev/null 2>&1 && podman info &>/dev/null 2>&1; then
    echo "podman compose"
    return
  fi
  if command -v podman-compose &>/dev/null && podman info &>/dev/null 2>&1; then
    echo "podman-compose"
    return
  fi
  echo "Erro: instale Docker Compose ou Podman Compose na VPS." >&2
  exit 1
}

COMPOSE="$(pick_compose)"
FILE="-f docker-compose.prod.yml"

if [ ! -f .env ]; then
  echo "Erro: arquivo .env não encontrado." >&2
  echo "Copie: cp .env.production.example .env && edite as senhas." >&2
  exit 1
fi

cmd="${1:-up}"
shift || true

echo "→ Usando: $COMPOSE $FILE"

case "$cmd" in
  up)
    exec $COMPOSE $FILE up -d --build "$@"
    ;;
  down)
    exec $COMPOSE $FILE down "$@"
    ;;
  logs)
    exec $COMPOSE $FILE logs -f "$@"
    ;;
  ps)
    exec $COMPOSE $FILE ps "$@"
    ;;
  restart)
    exec $COMPOSE $FILE restart "$@"
    ;;
  rebuild)
    exec $COMPOSE $FILE up -d --build --force-recreate "$@"
    ;;
  shell-api)
    exec $COMPOSE $FILE exec api sh
    ;;
  shell-db)
    exec $COMPOSE $FILE exec db psql -U "${POSTGRES_USER:-gameparty}" -d "${POSTGRES_DB:-gameparty}"
    ;;
  *)
    echo "Uso: $0 {up|down|logs|ps|restart|rebuild|shell-api|shell-db} [args...]"
    exit 1
    ;;
esac
