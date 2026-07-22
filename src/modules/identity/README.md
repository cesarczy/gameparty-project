# Módulo: Identidade

## Responsabilidade

Registro, autenticação, perfil do **Jogador**, favoritos, social (amigos, DMs, bloqueios, denúncias, notificações), administração e logs de atividade.

## Agregados

- `Jogador`

## Use cases principais

**Auth e perfil:** RegistrarJogador, AutenticarJogador, AutenticarGoogle, ObterPerfil, AtualizarPerfil, AlterarEmail, AlterarSenha, UploadAvatar, VerificarEmail, SolicitarRecuperacaoSenha, RedefinirSenha

**Favoritos:** AdicionarJogoFavorito, RemoverJogoFavorito

**Social:** amigos, bloqueios, denúncias, notificações, mensagens privadas (`SocialUseCases`)

**Admin:** painel, jogadores, catálogo admin, logs (`admin.use-case.ts`, `admin-jogador.use-case.ts`, `admin-catalog.use-case.ts`)

## Infra relevante

- `PrivateMessageHub` — WebSocket de DMs
- `ConsoleEmailSender` — e-mail em dev (log no container)
- `LocalAvatarStorage` — uploads em `/uploads`

## Integrações

| Contexto | Tipo | Mecanismo |
|----------|------|-----------|
| Catálogo | Conformist | Valida `GameId` via `GameCatalogReader` ao favoritar |
| Salas ao Vivo | Customer-Supplier | Expõe `PlayerProfileReader`; consome `PlayerId` |
