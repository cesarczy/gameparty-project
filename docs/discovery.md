# Project Discovery — GameParty

**Produto:** GameParty  
**Domínio:** gameparty.com.br  
**Data:** 2026-07-21

---

## Visão

GameParty é uma plataforma de chat ao vivo para jogadores encontrarem companhia — seja para partidas online competitivas/casuais ou para campanhas longas de RPG e jogos cooperativos. O produto centraliza salas temáticas por jogo e categoria, permitindo que pessoas com interesses similares se conectem rapidamente, conversem em tempo real e formem grupos (parties) para jogar juntos.

---

## Problema

Encontrar companhia para jogar é fragmentado: Discord, fóruns, grupos de WhatsApp e LFG dentro de cada jogo não escalam bem quando o jogador quer **vários tipos de jogos** e **filtros por categoria/modo**. Quem busca campanha de RPG ou grupo fixo para MMO sofre com salas genéricas, spam e falta de contexto (jogo, horário, idioma, plataforma). GameParty resolve isso oferecendo **chat ao vivo contextualizado por jogo e categoria**, com linguagem e fluxos pensados para formação de party.

---

## Personas

| Persona | Objetivo | Dor principal |
|---------|----------|---------------|
| **Solo Player** | Achar grupo rápido para uma sessão | Não sabe onde pedir party sem spam |
| **Party Leader** | Montar time completo (roles, nível) | Difícil filtrar quem está disponível agora |
| **Mestre de Campanha** | Recrutar jogadores para campanha longa | Precisa de perfil/commitment, não só chat efêmero |
| **Explorador Casual** | Descobrir jogos e comunidades | Quer navegar por categorias sem criar conta imediatamente |

---

## Jornadas principais

### J1 — Encontrar party para partida online (MVP)

1. Jogador entra em gameparty.com.br  
2. Escolhe jogo (ex.: Valorant) ou categoria (ex.: FPS)  
3. Vê salas de chat ativas ou cria uma nova (“LFG ranked, 2 vagas”)  
4. Conversa em tempo real, combina detalhes e forma party  
5. Sai da sala ou marca party como “formada”

### J2 — Recrutar para campanha (MVP simplificado)

1. Mestre cria sala com tag **Campanha** + jogo (ex.: D&D 5e)  
2. Define requisitos na descrição (horário, frequência, experiência)  
3. Interessados entram no chat e candidatam-se  
4. Mestre seleciona participantes (fora do MVP: convite direto)

### J3 — Descoberta por categoria (MVP)

1. Usuário navega categorias (RPG, MOBA, Survival, etc.)  
2. Vê jogos populares e salas em destaque  
3. Entra em sala ou favorita jogo para retorno posterior

---

## Requisitos funcionais (MoSCoW)

### Must (MVP)

| ID | Requisito |
|----|-----------|
| RF-M01 | Cadastro e login de jogador (e-mail + senha ou OAuth futuro) |
| RF-M02 | Catálogo de jogos com nome, slug, categoria(s) e modos suportados (online / campanha) |
| RF-M03 | Categorias de jogos navegáveis (ex.: FPS, RPG, MOBA, Cooperativo) |
| RF-M04 | Criar sala de chat vinculada a um jogo, com título e capacidade máxima |
| RF-M05 | Listar salas ativas por jogo ou categoria |
| RF-M06 | Entrar e sair de sala (respeitando capacidade) |
| RF-M07 | Mensagens de chat em tempo real dentro da sala |
| RF-M08 | Perfil mínimo do jogador (display name, jogos favoritos) |
| RF-M09 | Encerrar ou abandonar sala pelo criador |

### Should (pós-MVP imediato)

| ID | Requisito | Status |
|----|-----------|--------|
| RF-S01 | Filtros: plataforma (PC, console), idioma, modo (ranked/casual/campanha) | Pendente |
| RF-S02 | Notificações in-app de menções ou convites | ✅ Parcial (notificações + poll) |
| RF-S03 | Moderação básica (reportar usuário/mensagem) | ✅ Denúncias |
| RF-S04 | Histórico recente de mensagens ao entrar na sala | ✅ |
| RF-S05 | Status de presença (online, em sala, ausente) | ✅ Parcial (online/offline chat) |

### Could

| ID | Requisito | Status |
|----|-----------|--------|
| RF-C01 | Integração OAuth (Steam, Discord, Google) | ✅ Google · Steam/Discord pendentes |
| RF-C02 | Matchmaking automático por critérios |
| RF-C03 | Voz integrada (WebRTC ou link Discord) |
| RF-C04 | Reputação / reviews pós-sessão |
| RF-C05 | Salas privadas com convite por link |

### Won't (agora)

| ID | Requisito |
|----|-----------|
| RF-W01 | Marketplace ou venda de itens |
| RF-W02 | Streaming integrado |
| RF-W03 | App mobile nativo (web responsiva primeiro) |

---

## Escopo MVP

- [x] Autenticação e perfil de jogador (incl. avatar, e-mail, senha, recuperação)
- [x] CRUD administrativo de jogos e categorias (seed + painel `/admin`)
- [x] Salas de chat por jogo (lobbies fixos por título)
- [x] Chat em tempo real (WebSocket)
- [x] Listagem e busca de salas/jogos por categoria
- [x] Frontend web (React) — lobby, salas, chat, perfil, admin, DMs
- [x] API REST + domínio DDD conforme specs do repositório

**Fora do MVP / pendente:** matchmaking automático, voz, OAuth Steam/Discord, e-mail SMTP real, app nativo.

---

## Requisitos não-funcionais (NFRs)

| Atributo | Meta |
|----------|------|
| Latência API (REST) | < 200 ms p95 |
| Latência mensagem chat | < 150 ms p95 entrega na sala |
| Disponibilidade | 99,5% mensal (MVP) |
| Usuários concorrentes por sala | até 50 (MVP); arquitetura permite escalar |
| Usuários simultâneos na plataforma | 1 000 (MVP) |
| Segurança | HTTPS, senhas hasheadas (bcrypt/argon2), rate limit em auth e chat |
| Privacidade | LGPD: consentimento, exclusão de conta, mínimo de dados |
| i18n | PT-BR primário; estrutura preparada para EN |
| Observabilidade | logs estruturados, métricas de conexões WS e erros |
| Testes | cobertura mínima em domínio e use cases (spec 11) |

---

## Restrições técnicas

| Item | Decisão |
|------|---------|
| Linguagem | TypeScript |
| Runtime | Node.js |
| API HTTP | Fastify (performance + schema validation) |
| ORM / DB | Prisma + PostgreSQL |
| Tempo real | WebSocket (Socket.io ou ws nativo via adapter) |
| Frontend | React + Vite |
| Testes | Vitest |
| Arquitetura | Clean Architecture + DDD (specs deste kit) |
| Deploy alvo | gameparty.com.br — containerizado (Docker), reverse proxy TLS |
| Domínio | Sem dependência de APIs proprietárias de jogos no MVP |

---

## Premissas

- Público inicial: jogadores brasileiros, conteúdo e UX em PT-BR.
- Catálogo de jogos populado manualmente/seeds no MVP (sem scraper de lojas).
- Chat é texto; voz fica para iteração posterior.
- Usuários aceitam criar conta para criar salas; visitantes podem apenas ler lobby (decisão revisável na spec 02).
- PostgreSQL único no MVP; Redis para pub/sub de chat pode ser introduzido na spec 08 se necessário.

---

## Riscos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Spam/toxicidade em chat aberto | Alto | Rate limit, report, moderação na iterção 2 |
| Baixa densidade de usuários iniciais | Alto | Salas por categoria + destaque; marketing em comunidades |
| Escalabilidade WebSocket | Médio | Adapter desacoplado; horizontal scaling na infra |
| Catálogo de jogos desatualizado | Baixo | Admin simples + contribuição comunitária futura |
| Conflito de termos com marcas de jogos | Médio | Uso nominativo/informativo; política de DMCA |

---

## Stakeholders

| Papel | Interesse |
|-------|-----------|
| Product Owner | MVP de LFG + chat confiável |
| Jogadores finais | Achar party rápido, UX simples |
| Operações | Moderar conteúdo, métricas de engajamento |
| Desenvolvimento | Manter CA/DDD e evolução sem reescrita |

---

## Métricas de sucesso (MVP)

- Tempo médio até primeira mensagem em sala < 2 min após entrada
- ≥ 30% dos visitantes do lobby entram em pelo menos uma sala
- ≥ 10 salas ativas simultâneas em horário de pico (meta inicial)
- Zero violações críticas de camadas no harness

---

## Evolução

Documentação viva: [`README.md`](../README.md), [`docs/context-map.md`](context-map.md), [`docs/delivery-report.md`](delivery-report.md).
