# GameParty

**[gameparty.com.br](https://gameparty.com.br)** — plataforma de chat ao vivo para encontrar companhia, formar parties e conversar com a comunidade gamer.

Lobby por categorias e jogos, salas de chat em tempo real, mensagens privadas, perfil, favoritos e painel administrativo.

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Node.js 22+, TypeScript, Fastify, Prisma, PostgreSQL |
| Frontend | React, Vite, React Router |
| Tempo real | WebSocket (salas e mensagens privadas) |
| Auth | JWT, bcrypt, Google OAuth (opcional) |
| Arquitetura | Clean Architecture + DDD |

## Bounded contexts

| Contexto | Responsabilidade |
|----------|------------------|
| **Identidade** | Cadastro, login, perfil, social, admin, favoritos |
| **Catálogo** | Jogos, categorias, busca |
| **Salas ao Vivo** | Lobbies fixos, chat, participantes online |

Mapa detalhado: [`docs/context-map.md`](docs/context-map.md) · Discovery: [`docs/discovery.md`](docs/discovery.md)

---

## Início rápido (Docker / Podman)

```bash
sudo dnf install podman podman-compose   # uma vez
./docker/dev.sh up
```

| Serviço | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:3000 |
| Health | http://localhost:3000/health |

Migrations e seed rodam automaticamente ao subir a API.

### Comandos úteis

```bash
./docker/dev.sh down      # parar containers
./docker/dev.sh logs      # acompanhar logs
./docker/dev.sh test      # testes no container da API
./docker/dev.sh reset     # apaga volumes e recria do zero
./docker/dev.sh shell-api # shell dentro da API
./docker/dev.sh shell-db  # psql no PostgreSQL
```

Atalhos via npm: `npm run docker:up`, `docker:down`, `docker:logs`, `docker:test`, `docker:reset`.

Mais detalhes: [`docs/docker.md`](docs/docker.md)

---

### Variáveis de ambiente

| Arquivo | Propósito |
|---------|-----------|
| `.env.example` | Modelo versionado — lista todas as variáveis |

No Docker, a API usa variáveis do `docker-compose.yml`. Para login Google, exporte `GOOGLE_CLIENT_ID` no host antes de `./docker/dev.sh up`.

---

## Conta de desenvolvimento

Criada automaticamente pelo seed:

| Campo | Valor |
|-------|-------|
| E-mail | `admin@gameparty.com.br` |
| Senha | `admin12345678` |
| Usuário | `@admin` |
| Papel | Administrador (painel em `/admin`) |

Altere `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env` antes do seed em ambientes personalizados.

---

## Funcionalidades

### Jogador

- Cadastro com verificação de e-mail, login e recuperação de senha
- Lobby com categorias, busca de jogos e favoritos
- Chat ao vivo por jogo (lobby fixo por título)
- Mensagens privadas em tempo real
- Perfil: avatar, nome, e-mail, senha, aparência, amigos, bloqueios
- Níveis / insígnias por tempo na plataforma (e manual via admin)

### Administração (`/admin`)

- Painel, jogadores, denúncias, salas ativas, catálogo
- Edição de cadastro, banimento, papéis e insígnias
- Logs de atividade

---

## Rotas do frontend

| Rota | Descrição |
|------|-----------|
| `/` | Lobby |
| `/login`, `/register` | Autenticação |
| `/esqueci-senha`, `/redefinir-senha` | Recuperação de senha |
| `/conta` | Configurações da conta |
| `/salas/:roomId` | Chat da sala |
| `/mensagens/:peerId` | Mensagem privada |
| `/jogadores/:playerId` | Perfil público |
| `/admin` | Painel admin |
| `/termos` | Termos de uso |

---

## API (resumo)

Autenticação via header `Authorization: Bearer <token>` quando indicado.

### Auth e perfil

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | — | Cadastro |
| POST | `/api/auth/login` | — | Login (JWT) |
| POST | `/api/auth/google` | — | Login Google |
| GET | `/api/profile/me` | ✓ | Perfil logado |
| PATCH | `/api/profile/me` | ✓ | Atualizar perfil |

### Catálogo e salas

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/categorias` | — | Categorias |
| GET | `/api/categorias/:id/jogos` | — | Jogos por categoria |
| GET | `/api/jogos/busca?q=` | — | Buscar jogos |
| GET | `/api/salas?gameId=` | — | Salas ativas |
| GET | `/api/salas/:id/mensagens` | — | Histórico do chat |
| POST | `/api/salas/:id/entrar` | ✓ | Entrar na sala |
| POST | `/api/salas/:id/mensagens` | ✓ | Enviar mensagem |

### Social

| Método | Path | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/social/amigos` | ✓ | Lista de amigos |
| POST | `/api/social/mensagens` | ✓ | Enviar DM |
| GET | `/api/social/mensagens/:peerId` | ✓ | Histórico de DM |
| GET | `/api/social/notificacoes` | ✓ | Notificações |

### WebSocket

| Path | Uso |
|------|-----|
| `/ws/salas/:roomId` | Chat ao vivo da sala |
| `/ws/social/mensagens?token=` | Mensagens privadas em tempo real |

### Admin

Rotas sob `/api/admin/*` — requer papel `ADMIN`. Ver implementação em `src/modules/identity/presentation/http/admin.routes.ts`.

---

## Estrutura do projeto

```
src/
  modules/
    identity/     # jogadores, auth, social, admin
    catalog/      # jogos e categorias
    live-rooms/   # salas e chat
  shared/         # infra compartilhada (auth, db, erros)
frontend/         # SPA React
prisma/           # schema, migrations, seed
tests/            # Vitest (domínio, use cases, API)
harness/          # validação de arquitetura DDD/CA
docs/             # discovery, glossário, context map
docker/           # Dockerfiles e dev.sh
```

---

## Qualidade e testes

```bash
npm test              # Vitest (local)
npm run typecheck     # TypeScript
npm run harness       # regras de camadas, DDD e convenções
./docker/dev.sh test  # testes dentro do container
```

---

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [`docs/glossary.md`](docs/glossary.md) | Linguagem ubíqua |
| [`docs/ports-adapters.md`](docs/ports-adapters.md) | Portas e adapters |
| [`docs/workflow.md`](docs/workflow.md) | Fluxo de desenvolvimento |
| [`docs/delivery-report.md`](docs/delivery-report.md) | Relatório de entrega |
| [`AGENTS.md`](AGENTS.md) | Instruções para agentes de IA |

---

## Licença

Projeto privado — GameParty.
