#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

pick_compose() {
  if command -v podman-compose &>/dev/null && podman info &>/dev/null 2>&1; then
    echo "podman-compose"
    return
  fi

  if podman compose version &>/dev/null 2>&1 && podman info &>/dev/null 2>&1; then
    echo "podman compose"
    return
  fi

  if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
    echo "docker compose"
    return
  fi

  cat >&2 <<'EOF'
Erro: nenhum runtime de containers disponível.

Fedora (recomendado, rootless):
  sudo dnf install podman podman-compose
  ./docker/dev.sh up

Opcional — usar CLI "docker" via Podman + socket do usuário:
  sudo dnf install podman-docker
  systemctl --user enable --now podman.socket
  export DOCKER_HOST=unix:///run/user/$(id -u)/podman/podman.sock
EOF
  exit 1
}

COMPOSE="$(pick_compose)"
echo "→ Usando: $COMPOSE"

cmd="${1:-up}"
shift || true

case "$cmd" in
  up)
    exec $COMPOSE up --build "$@"
    ;;
  down)
    exec $COMPOSE down "$@"
    ;;
  logs)
    exec $COMPOSE logs -f "$@"
    ;;
  test)
    exec $COMPOSE run --rm api npm test
    ;;
  shell-api)
    exec $COMPOSE exec api sh
    ;;
  shell-db)
    exec $COMPOSE exec db psql -U gameparty -d gameparty
    ;;
  reset)
    $COMPOSE down -v
    exec $COMPOSE up --build
    ;;
  *)
    echo "Uso: $0 {up|down|logs|test|shell-api|shell-db|reset} [args...]"
    exit 1
    ;;
esac
