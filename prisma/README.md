# Persistência — mappers (Spec 07 → 08)

| Agregado | Repositório | Mapper |
|----------|-------------|--------|
| `Jogador` | `PrismaJogadorRepository` | `JogadorMapper` — inclui favoritos via `JogadorFavorito` |
| `Jogo` | `PrismaJogoRepository` | `JogoMapper` — `JogoModo` + `JogoCategoria` |
| `Categoria` | `PrismaCategoriaRepository` | `CategoriaMapper` |
| `Sala` | `PrismaSalaRepository` | `SalaMapper` — participantes em `SalaParticipante` |
| `Mensagem` | `PrismaMensagemRepository` | `MensagemMapper` |
| Social (amigos, DMs, etc.) | `PrismaSocialRepository` | queries Prisma diretas na infra |
| Activity logs | `PrismaActivityLogRepository` | — |

Queries cross-context (ex.: salas por categoria) via join na infra de live-rooms, nunca no domínio.
