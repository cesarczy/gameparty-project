import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import websocket from '@fastify/websocket';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from './config/env.js';
import { loadConfig } from './config/env.js';
import { getPrismaClient, disconnectPrisma } from '@shared/infrastructure/database/prisma.client.js';
import { InMemoryEventBus } from '@shared/application/ports/in-memory-event-bus.adapter.js';
import { LoggingEventBus } from '@shared/infrastructure/messaging/logging-event-bus.js';
import { JwtService } from '@shared/infrastructure/auth/jwt.service.js';
import { registerErrorHandler } from '@shared/presentation/http/error-handler.js';
import { registerAuthHook } from '@shared/presentation/http/auth.hook.js';

import { PrismaJogadorRepository } from '@identity/infrastructure/persistence/prisma-jogador.repository.js';
import { BcryptPasswordHasher } from '@identity/infrastructure/security/bcrypt-password-hasher.js';
import { GoogleAuthVerifier } from '@identity/infrastructure/auth/google-auth.verifier.js';
import { RegistrarJogadorUseCase } from '@identity/application/use-cases/registrar-jogador.use-case.js';
import { AutenticarJogadorUseCase } from '@identity/application/use-cases/autenticar-jogador.use-case.js';
import { AutenticarGoogleUseCase } from '@identity/application/use-cases/autenticar-google.use-case.js';
import { ObterPerfilUseCase } from '@identity/application/use-cases/obter-perfil.use-case.js';
import { AtualizarPerfilUseCase } from '@identity/application/use-cases/atualizar-perfil.use-case.js';
import { AlterarEmailUseCase } from '@identity/application/use-cases/alterar-email.use-case.js';
import { AlterarSenhaUseCase } from '@identity/application/use-cases/alterar-senha.use-case.js';
import { AtualizarAvatarUseCase } from '@identity/application/use-cases/atualizar-avatar.use-case.js';
import { UploadAvatarUseCase } from '@identity/application/use-cases/upload-avatar.use-case.js';
import { LocalAvatarStorage } from '@identity/infrastructure/storage/local-avatar.storage.js';
import {
  DefinirRoleJogadorUseCase,
  ListarDenunciasAdminUseCase,
  ListarJogadoresAdminUseCase,
  ListarJogosAdminUseCase,
  ListarSalasAtivasAdminUseCase,
  ObterPainelAdminUseCase,
} from '@identity/application/use-cases/admin.use-case.js';
import {
  AtualizarJogadorAdminUseCase,
  BanirJogadorAdminUseCase,
  BuscarJogadoresAdminUseCase,
  ExcluirJogadorAdminUseCase,
  ObterJogadorAdminUseCase,
} from '@identity/application/use-cases/admin-jogador.use-case.js';
import {
  CadastrarCategoriaAdminUseCase,
  CadastrarJogoAdminUseCase,
  ExcluirCategoriaAdminUseCase,
  ExcluirJogoAdminUseCase,
  AlterarStatusJogoAdminUseCase,
  AlterarStatusCategoriaAdminUseCase,
  ListarCategoriasAdminUseCase,
} from '@identity/application/use-cases/admin-catalog.use-case.js';
import {
  ListarLogsGlobaisAdminUseCase,
  ListarLogsJogadorAdminUseCase,
} from '@identity/application/use-cases/activity-log.use-case.js';
import { ActivityLogger } from '@identity/application/services/activity-logger.service.js';
import { PrismaActivityLogRepository } from '@identity/infrastructure/persistence/prisma-activity-log.repository.js';
import { AdicionarJogoFavoritoUseCase } from '@identity/application/use-cases/adicionar-jogo-favorito.use-case.js';
import { RemoverJogoFavoritoUseCase } from '@identity/application/use-cases/remover-jogo-favorito.use-case.js';
import { registerIdentityRoutes } from '@identity/presentation/http/identity.routes.js';
import { registerAdminRoutes } from '@identity/presentation/http/admin.routes.js';

import { PrismaCategoriaRepository } from '@catalog/infrastructure/persistence/prisma-categoria.repository.js';
import { PrismaJogoRepository } from '@catalog/infrastructure/persistence/prisma-jogo.repository.js';
import { PrismaGameCatalogReader } from '@catalog/infrastructure/persistence/prisma-game-catalog.reader.js';
import { ListarCategoriasUseCase } from '@catalog/application/use-cases/listar-categorias.use-case.js';
import { ListarJogosPorCategoriaUseCase } from '@catalog/application/use-cases/listar-jogos-por-categoria.use-case.js';
import { ObterJogoPorSlugUseCase } from '@catalog/application/use-cases/obter-jogo-por-slug.use-case.js';
import { CadastrarCategoriaUseCase } from '@catalog/application/use-cases/cadastrar-categoria.use-case.js';
import { CadastrarJogoUseCase } from '@catalog/application/use-cases/cadastrar-jogo.use-case.js';
import { registerCatalogRoutes } from '@catalog/presentation/http/catalog.routes.js';

import { PrismaSalaRepository } from '@live-rooms/infrastructure/persistence/prisma-sala.repository.js';
import { PrismaMensagemRepository } from '@live-rooms/infrastructure/persistence/prisma-mensagem.repository.js';
import { ChatRoomHub } from '@live-rooms/infrastructure/messaging/chat-room.hub.js';
import { ListarSalasAtivasUseCase } from '@live-rooms/application/use-cases/listar-salas-ativas.use-case.js';
import { ObterLobbyPorSlugUseCase } from '@live-rooms/application/use-cases/obter-lobby-por-slug.use-case.js';
import { EntrarNaSalaUseCase } from '@live-rooms/application/use-cases/entrar-na-sala.use-case.js';
import { SairDaSalaUseCase } from '@live-rooms/application/use-cases/sair-da-sala.use-case.js';
import { EnviarMensagemUseCase } from '@live-rooms/application/use-cases/enviar-mensagem.use-case.js';
import { ObterSalaUseCase } from '@live-rooms/application/use-cases/obter-sala.use-case.js';
import { ListarMensagensSalaUseCase } from '@live-rooms/application/use-cases/listar-mensagens-sala.use-case.js';
import { registerLiveRoomsRoutes } from '@live-rooms/presentation/http/live-rooms.routes.js';
import { VerificarEmailUseCase } from '@identity/application/use-cases/verificar-email.use-case.js';
import { SolicitarRecuperacaoSenhaUseCase } from '@identity/application/use-cases/solicitar-recuperacao-senha.use-case.js';
import { RedefinirSenhaUseCase } from '@identity/application/use-cases/redefinir-senha.use-case.js';
import { ConsoleEmailSender } from '@identity/infrastructure/email/console-email.sender.js';
import { BuscarJogosUseCase } from '@catalog/application/use-cases/buscar-jogos.use-case.js';

import { PrismaSocialRepository } from '@identity/infrastructure/persistence/prisma-social.repository.js';
import {
  AtualizarConfiguracoesUseCase,
  ObterPerfilPublicoUseCase,
  SocialUseCases,
} from '@identity/application/use-cases/social.use-cases.js';
import { registerSocialRoutes } from '@identity/presentation/http/social.routes.js';
import { PrivateMessageHub } from '@identity/infrastructure/messaging/private-message.hub.js';

export interface AppContainer {
  app: ReturnType<typeof Fastify>;
  prisma: ReturnType<typeof getPrismaClient>;
  chatHub: ChatRoomHub;
}

export async function buildApp(config?: AppConfig): Promise<AppContainer> {
  const cfg = config ?? loadConfig();
  const prisma = getPrismaClient();
  const eventBus = new LoggingEventBus(new InMemoryEventBus());
  const jwt = new JwtService(cfg.JWT_SECRET);
  const chatHub = new ChatRoomHub();
  const privateMessageHub = new PrivateMessageHub();

  const jogadorRepo = new PrismaJogadorRepository(prisma);
  const passwordHasher = new BcryptPasswordHasher();
  const categoriaRepo = new PrismaCategoriaRepository(prisma);
  const jogoRepo = new PrismaJogoRepository(prisma);
  const gameCatalog = new PrismaGameCatalogReader(prisma);
  const salaRepo = new PrismaSalaRepository(prisma);
  const mensagemRepo = new PrismaMensagemRepository(prisma);
  const socialRepo = new PrismaSocialRepository(prisma);
  const activityLogRepo = new PrismaActivityLogRepository(prisma);
  const activityLogger = new ActivityLogger(activityLogRepo, jogadorRepo);
  const emailSender = new ConsoleEmailSender();

  const googleVerifier = cfg.GOOGLE_CLIENT_ID
    ? new GoogleAuthVerifier(cfg.GOOGLE_CLIENT_ID)
    : null;

  const app = Fastify({
    logger: { level: cfg.LOG_LEVEL },
    genReqId: () => crypto.randomUUID(),
  });

  await app.register(cors, { origin: cfg.CORS_ORIGIN });
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024, files: 1 } });
  await app.register(websocket);

  const uploadsRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
  await app.register(fastifyStatic, {
    root: uploadsRoot,
    prefix: '/uploads/',
    decorateReply: false,
  });

  const avatarStorage = new LocalAvatarStorage(uploadsRoot);
  const atualizarAvatar = new AtualizarAvatarUseCase(jogadorRepo);

  registerErrorHandler(app);
  registerAuthHook(app, jwt);

  app.get('/health', async () => ({ status: 'ok', service: 'gameparty' }));

  registerIdentityRoutes(app, {
    registrar: new RegistrarJogadorUseCase(jogadorRepo, passwordHasher, eventBus),
    autenticar: new AutenticarJogadorUseCase(jogadorRepo, passwordHasher),
    autenticarGoogle: new AutenticarGoogleUseCase(
      jogadorRepo,
      googleVerifier ?? {
        verify: async () => {
          throw new Error('GOOGLE_CLIENT_ID não configurado');
        },
      },
      eventBus,
    ),
    obterPerfil: new ObterPerfilUseCase(jogadorRepo),
    atualizarPerfil: new AtualizarPerfilUseCase(jogadorRepo),
    alterarEmail: new AlterarEmailUseCase(jogadorRepo, passwordHasher),
    alterarSenha: new AlterarSenhaUseCase(jogadorRepo, passwordHasher),
    uploadAvatar: new UploadAvatarUseCase(jogadorRepo, avatarStorage, atualizarAvatar),
    adicionarFavorito: new AdicionarJogoFavoritoUseCase(jogadorRepo, gameCatalog),
    removerFavorito: new RemoverJogoFavoritoUseCase(jogadorRepo),
    verificarEmail: new VerificarEmailUseCase(jogadorRepo),
    solicitarRecuperacaoSenha: new SolicitarRecuperacaoSenhaUseCase(
      jogadorRepo,
      emailSender,
      config.CORS_ORIGIN,
    ),
    redefinirSenha: new RedefinirSenhaUseCase(jogadorRepo, passwordHasher),
    jwt,
    activityLogger,
    jogadorRepo,
  });

  registerSocialRoutes(app, {
    social: new SocialUseCases(jogadorRepo, socialRepo),
    obterPerfilPublico: new ObterPerfilPublicoUseCase(jogadorRepo, socialRepo),
    atualizarConfiguracoes: new AtualizarConfiguracoesUseCase(jogadorRepo),
    activityLogger,
    jogadorRepo,
    privateMessageHub,
    jwt,
  });

  registerAdminRoutes(app, {
    obterPainel: new ObterPainelAdminUseCase(jogadorRepo, {
      countGames: () => prisma.jogo.count(),
      countCategories: () => prisma.categoria.count(),
      countOnlinePlayers: () => socialRepo.countOnlinePlayers(),
      countActiveRooms: () => socialRepo.countActiveRooms(),
      countNewPlayersToday: () => socialRepo.countNewPlayersToday(),
      countOpenReports: () => socialRepo.countOpenReports(),
    }),
    listarJogadores: new ListarJogadoresAdminUseCase(jogadorRepo),
    listarDenuncias: new ListarDenunciasAdminUseCase(
      jogadorRepo,
      () => socialRepo.listOpenReports(),
    ),
    listarSalasAtivas: new ListarSalasAtivasAdminUseCase(
      jogadorRepo,
      () => socialRepo.listActiveRooms(),
    ),
    listarJogos: new ListarJogosAdminUseCase(jogadorRepo, async () => {
      const rows = await prisma.jogo.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true, active: true },
      });
      return rows.map((row) => ({
        gameId: row.id,
        name: row.name,
        slug: row.slug,
        active: row.active,
      }));
    }),
    buscarJogadores: new BuscarJogadoresAdminUseCase(jogadorRepo),
    obterJogador: new ObterJogadorAdminUseCase(jogadorRepo),
    atualizarJogador: new AtualizarJogadorAdminUseCase(jogadorRepo, passwordHasher),
    banirJogador: new BanirJogadorAdminUseCase(jogadorRepo),
    excluirJogador: new ExcluirJogadorAdminUseCase(jogadorRepo),
    cadastrarCategoria: new CadastrarCategoriaAdminUseCase(
      jogadorRepo,
      new CadastrarCategoriaUseCase(categoriaRepo),
    ),
    excluirCategoria: new ExcluirCategoriaAdminUseCase(jogadorRepo, categoriaRepo),
    cadastrarJogo: new CadastrarJogoAdminUseCase(
      jogadorRepo,
      new CadastrarJogoUseCase(jogoRepo, categoriaRepo, eventBus),
    ),
    excluirJogo: new ExcluirJogoAdminUseCase(jogadorRepo, jogoRepo),
    alterarStatusJogo: new AlterarStatusJogoAdminUseCase(jogadorRepo, jogoRepo),
    alterarStatusCategoria: new AlterarStatusCategoriaAdminUseCase(jogadorRepo, categoriaRepo),
    listarCategoriasAdmin: new ListarCategoriasAdminUseCase(jogadorRepo, categoriaRepo),
    listarLogsJogador: new ListarLogsJogadorAdminUseCase(jogadorRepo, activityLogRepo),
    listarLogsGlobais: new ListarLogsGlobaisAdminUseCase(jogadorRepo, activityLogRepo),
    definirRole: new DefinirRoleJogadorUseCase(jogadorRepo),
    activityLogger,
    jwt,
    jogadorRepo,
  });

  registerCatalogRoutes(app, {
    listarCategorias: new ListarCategoriasUseCase(categoriaRepo),
    listarJogos: new ListarJogosPorCategoriaUseCase(jogoRepo, salaRepo),
    buscarJogos: new BuscarJogosUseCase(jogoRepo, salaRepo),
    obterJogo: new ObterJogoPorSlugUseCase(jogoRepo),
    cadastrarCategoria: new CadastrarCategoriaUseCase(categoriaRepo),
    cadastrarJogo: new CadastrarJogoUseCase(jogoRepo, categoriaRepo, eventBus),
  });

  registerLiveRoomsRoutes(app, {
    listarSalas: new ListarSalasAtivasUseCase(salaRepo),
    obterLobby: new ObterLobbyPorSlugUseCase(jogoRepo, salaRepo),
    obterSala: new ObterSalaUseCase(salaRepo, jogoRepo),
    listarMensagens: new ListarMensagensSalaUseCase(mensagemRepo),
    entrar: new EntrarNaSalaUseCase(salaRepo, jogadorRepo, eventBus),
    sair: new SairDaSalaUseCase(salaRepo, eventBus),
    enviarMensagem: new EnviarMensagemUseCase(salaRepo, mensagemRepo, jogadorRepo, eventBus),
    chatHub,
  });

  return { app, prisma, chatHub };
}

export async function startServer(config?: AppConfig) {
  const cfg = config ?? loadConfig();
  const { app } = await buildApp(cfg);

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, 'Encerrando servidor');
    await app.close();
    await disconnectPrisma();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await app.listen({ port: cfg.PORT, host: cfg.HOST });
  app.log.info(`GameParty API em http://${cfg.HOST}:${cfg.PORT}`);
  return app;
}
