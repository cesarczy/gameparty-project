# Delivery Report — GameParty

**Última revisão:** 2026-07-21

## Harness

```bash
npm run harness          # validação de arquitetura (host)
./docker/dev.sh test     # testes Vitest (container)
```

## Specs do kit (pipeline inicial)

Todas executadas na entrega MVP base:

- [x] 01 — Project Discovery
- [x] 02 — Bounded Context
- [x] 03 — Domain Model
- [x] 04 — Use Cases
- [x] 05 — Ports & Adapters
- [x] 06 — Module Structure
- [x] 07 — Prisma Schema
- [x] 08 — Backend
- [x] 09 — Frontend
- [x] 10 — Integration
- [x] 11 — Testing
- [x] 12 — Validation

> Os arquivos em `specs/` descrevem o **pipeline de construção**, não o estado funcional atual. Para features implementadas depois do MVP, ver README e este relatório.

## Artefatos principais

| Área | Paths |
|------|-------|
| Domínio | `src/modules/*/domain/` |
| Use cases | `src/modules/*/application/use-cases/` |
| Infra | `src/modules/*/infrastructure/` |
| API | `src/composition-root.ts`, `src/main.ts` |
| Prisma | `prisma/schema.prisma`, `prisma/migrations/` |
| Frontend | `frontend/src/` |
| Testes | `tests/` |

## Funcionalidades entregues (além do MVP base)

| Feature | Status |
|---------|--------|
| Lobbies fixos por jogo (sem criar sala manual no UI) | ✅ |
| Chat de sala em tempo real (WebSocket) | ✅ |
| Mensagens privadas + WebSocket | ✅ |
| Perfil completo (avatar, e-mail, senha, aparência) | ✅ |
| Amigos, bloqueios, denúncias, notificações | ✅ |
| Verificação de e-mail e recuperação de senha | ✅ |
| Login Google (opcional, `GOOGLE_CLIENT_ID`) | ✅ |
| Painel admin (jogadores, catálogo, logs, denúncias) | ✅ |
| Níveis / insígnias (automático + manual) | ✅ |
| Filtro de palavrões no chat | ✅ |
| Busca de jogos no lobby | ✅ |

## Demo rápida

1. `./docker/dev.sh up` → http://localhost:5173
2. Login admin: `admin@gameparty.com.br` / `admin12345678`
3. Lobby → escolher jogo → entrar no chat da sala
4. `/conta` → perfil, amigos, configurações
5. `/admin` → painel administrativo

## Débitos conhecidos

| Item | Notas |
|------|-------|
| E-mail transacional real | `ConsoleEmailSender` — links logados no container |
| OAuth Steam/Discord | Não implementado |
| SMTP / deploy produção | Pendente |
| Redis para fan-out WS multi-instância | Hub in-memory (single node) |
| Retenção automática mensagens de sala | ✅ 90 dias (configurável via env) |
| Retenção mensagens privadas | Pendente |
| Testes E2E com PostgreSQL real | Opcional via `DATABASE_URL` |

## Métricas de qualidade

- Domínio e use cases com testes unitários (`tests/`)
- Smoke test de API sem PostgreSQL (`tests/api/smoke.test.ts`)
- Harness valida dependências entre camadas e convenções DDD/CA
