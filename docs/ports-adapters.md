# Ports & Adapters — GameParty

Matriz de portas e adapters implementados.

## Shared

| Port | Adapter | Camada |
|------|---------|--------|
| `EventBus` | `InMemoryEventBus`, `LoggingEventBus` | shared/infrastructure |
| JWT | `JwtService` (jose) | shared/infrastructure |

## Identidade

| Port | Adapter | Camada |
|------|---------|--------|
| `JogadorRepository` | `PrismaJogadorRepository` | identity/infrastructure |
| `PasswordHasher` | `BcryptPasswordHasher` | identity/infrastructure |
| `PlayerProfileReader` | `PrismaPlayerProfileReader` | identity/infrastructure |
| `EmailSender` | `ConsoleEmailSender` (dev) | identity/infrastructure |
| `AvatarStorage` | `LocalAvatarStorage` | identity/infrastructure |
| Social (repo) | `PrismaSocialRepository` | identity/infrastructure |
| Activity logs | `PrismaActivityLogRepository` | identity/infrastructure |
| DMs tempo real | `PrivateMessageHub` | identity/infrastructure |
| Google OAuth | `GoogleAuthVerifier` | identity/infrastructure |

## Catálogo

| Port | Adapter | Camada |
|------|---------|--------|
| `JogoRepository` | `PrismaJogoRepository` | catalog/infrastructure |
| `CategoriaRepository` | `PrismaCategoriaRepository` | catalog/infrastructure |
| `GameCatalogReader` | `PrismaGameCatalogReader` | catalog/infrastructure |

## Salas ao Vivo

| Port | Adapter | Camada |
|------|---------|--------|
| `SalaRepository` | `PrismaSalaRepository` | live-rooms/infrastructure |
| `MensagemRepository` | `PrismaMensagemRepository` | live-rooms/infrastructure |
| Chat tempo real | `ChatRoomHub` | live-rooms/infrastructure |
| `GameCatalogReader` | ACL → `PrismaGameCatalogReader` | injetado via composition-root |

## Composição (`src/composition-root.ts`)

```
buildApp()
├── shared: EventBus, JwtService, Prisma client
├── identity: repos, social, email, avatar, PrivateMessageHub, use cases, routes
├── catalog: repos, use cases, routes
├── live-rooms: repos, ChatRoomHub, use cases, routes + WS salas
└── presentation: Fastify, CORS, multipart, static /uploads
```

Cross-context: `GameCatalogReader` implementado no catálogo e injetado em identity (favoritos) e live-rooms (salas).
