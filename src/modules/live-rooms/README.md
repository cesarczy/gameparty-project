# Módulo: Salas ao Vivo

## Responsabilidade

Ciclo de vida de **Salas** de chat (incl. lobbies fixos por jogo), **Participantes** e **Mensagens** de sala; chat em tempo real via `ChatRoomHub`.

## Agregados

- `Sala` (root — participantes e capacidade)
- `Mensagem`

## Use cases

- CriarSala / EncerrarSala (API; UI usa lobbies fixos do seed)
- ListarSalasAtivas, ObterSala, ObterLobbyPorSlug
- EntrarNaSala, SairDaSala
- EnviarMensagem, ListarMensagensSala

## Tempo real

- `ChatRoomHub` + rota `GET /ws/salas/:roomId`
- Broadcast ao enviar mensagem ou alterar contagem de participantes

## Integrações

| Contexto | Tipo | Mecanismo |
|----------|------|-----------|
| Catálogo | Customer-Supplier | `GameCatalogReader` ao criar/validar sala |
| Identidade | Customer-Supplier + ACL | `PlayerId` / `PlayerProfileReader` |

> Mensagens **privadas** ficam no módulo Identidade (`PrivateMessageHub`).
