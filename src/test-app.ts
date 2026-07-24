import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import { InMemoryEventBus } from '@shared/application/ports/in-memory-event-bus.adapter.js';
import { JwtService } from '@shared/infrastructure/auth/jwt.service.js';
import { registerErrorHandler } from '@shared/presentation/http/error-handler.js';
import { registerAuthHook } from '@shared/presentation/http/auth.hook.js';
import { RegistrarJogadorUseCase } from '@identity/application/use-cases/registrar-jogador.use-case.js';
import { AutenticarJogadorUseCase } from '@identity/application/use-cases/autenticar-jogador.use-case.js';
import { AutenticarGoogleUseCase } from '@identity/application/use-cases/autenticar-google.use-case.js';
import { ObterPerfilUseCase } from '@identity/application/use-cases/obter-perfil.use-case.js';
import { AtualizarPerfilUseCase } from '@identity/application/use-cases/atualizar-perfil.use-case.js';
import { AlterarEmailUseCase } from '@identity/application/use-cases/alterar-email.use-case.js';
import { AlterarSenhaUseCase } from '@identity/application/use-cases/alterar-senha.use-case.js';
import { AtualizarAvatarUseCase } from '@identity/application/use-cases/atualizar-avatar.use-case.js';
import { UploadAvatarUseCase } from '@identity/application/use-cases/upload-avatar.use-case.js';
import type { AvatarStorage } from '@identity/application/ports/avatar-storage.port.js';
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
import { ActivityLogger } from '@identity/application/services/activity-logger.service.js';
import type { ActivityLogRepository } from '@identity/application/ports/activity-log.repository.js';
import {
  ListarLogsGlobaisAdminUseCase,
  ListarLogsJogadorAdminUseCase,
} from '@identity/application/use-cases/activity-log.use-case.js';
import {
  AlterarStatusCategoriaAdminUseCase,
  AlterarStatusJogoAdminUseCase,
  AtualizarCategoriaAdminUseCase,
  AtualizarJogoAdminUseCase,
  CadastrarCategoriaAdminUseCase,
  CadastrarJogoAdminUseCase,
  ExcluirCategoriaAdminUseCase,
  ExcluirJogoAdminUseCase,
  ListarCategoriasAdminUseCase,
  ObterCategoriaAdminUseCase,
  ObterJogoAdminUseCase,
  UploadCapaJogoAdminUseCase,
} from '@identity/application/use-cases/admin-catalog.use-case.js';
import { AdicionarJogoFavoritoUseCase } from '@identity/application/use-cases/adicionar-jogo-favorito.use-case.js';
import { RemoverJogoFavoritoUseCase } from '@identity/application/use-cases/remover-jogo-favorito.use-case.js';
import { registerIdentityRoutes } from '@identity/presentation/http/identity.routes.js';
import { registerAdminRoutes } from '@identity/presentation/http/admin.routes.js';
import { ListarCategoriasUseCase } from '@catalog/application/use-cases/listar-categorias.use-case.js';
import { ListarJogosPorCategoriaUseCase } from '@catalog/application/use-cases/listar-jogos-por-categoria.use-case.js';
import { ObterJogoPorSlugUseCase } from '@catalog/application/use-cases/obter-jogo-por-slug.use-case.js';
import { CadastrarCategoriaUseCase } from '@catalog/application/use-cases/cadastrar-categoria.use-case.js';
import { CadastrarJogoUseCase } from '@catalog/application/use-cases/cadastrar-jogo.use-case.js';
import { AtualizarCategoriaUseCase } from '@catalog/application/use-cases/atualizar-categoria.use-case.js';
import { AtualizarJogoUseCase } from '@catalog/application/use-cases/atualizar-jogo.use-case.js';
import { UploadCapaJogoUseCase } from '@catalog/application/use-cases/upload-capa-jogo.use-case.js';
import type { GameCoverStorage } from '@catalog/application/ports/game-cover-storage.port.js';
import { registerCatalogRoutes } from '@catalog/presentation/http/catalog.routes.js';
import { ListarSalasAtivasUseCase } from '@live-rooms/application/use-cases/listar-salas-ativas.use-case.js';
import { ObterLobbyPorSlugUseCase } from '@live-rooms/application/use-cases/obter-lobby-por-slug.use-case.js';
import { EntrarNaSalaUseCase } from '@live-rooms/application/use-cases/entrar-na-sala.use-case.js';
import { SairDaSalaUseCase } from '@live-rooms/application/use-cases/sair-da-sala.use-case.js';
import { EnviarMensagemUseCase } from '@live-rooms/application/use-cases/enviar-mensagem.use-case.js';
import { RoomMessageCooldown } from '@live-rooms/infrastructure/rate-limit/room-message-cooldown.js';
import { ObterSalaUseCase } from '@live-rooms/application/use-cases/obter-sala.use-case.js';
import { ListarMensagensSalaUseCase } from '@live-rooms/application/use-cases/listar-mensagens-sala.use-case.js';
import { VerificarEmailUseCase } from '@identity/application/use-cases/verificar-email.use-case.js';
import { SolicitarRecuperacaoSenhaUseCase } from '@identity/application/use-cases/solicitar-recuperacao-senha.use-case.js';
import { RedefinirSenhaUseCase } from '@identity/application/use-cases/redefinir-senha.use-case.js';
import { ConsoleEmailSender } from '@identity/infrastructure/email/console-email.sender.js';
import { BuscarJogosUseCase } from '@catalog/application/use-cases/buscar-jogos.use-case.js';
import { ChatRoomHub } from '@live-rooms/infrastructure/messaging/chat-room.hub.js';
import { Sala } from '@live-rooms/domain/sala/sala.aggregate.js';
import { Capacity } from '@live-rooms/domain/value-objects/capacity.vo.js';
import { ModoSalaVo } from '@live-rooms/domain/value-objects/modo-sala.vo.js';
import { RoomStatus } from '@live-rooms/domain/value-objects/room-status.vo.js';
import { RoomTitle } from '@live-rooms/domain/value-objects/room-title.vo.js';
import { SalaId } from '@live-rooms/domain/value-objects/sala-id.vo.js';
import type { AppConfig } from '../config/env.js';
import {
  FakePasswordHasher,
  InMemoryGameCatalogReader,
  InMemoryJogadorRepository,
} from '@shared/testing/in-memory-adapters.js';
import type { CategoriaRepository } from '@catalog/application/ports/categoria.repository.js';
import type { JogoRepository } from '@catalog/application/ports/jogo.repository.js';
import type { SalaRepository } from '@live-rooms/application/ports/sala.repository.js';
import type { MensagemRepository } from '@live-rooms/application/ports/sala.repository.js';
import { Categoria } from '@catalog/domain/categoria/categoria.aggregate.js';
import { Jogo } from '@catalog/domain/jogo/jogo.aggregate.js';
import { GameMode } from '@catalog/domain/value-objects/game-mode.vo.js';
import { CategoriaId } from '@catalog/domain/value-objects/categoria-id.vo.js';
import { Slug } from '@catalog/domain/value-objects/slug.vo.js';
import { JogoId } from '@catalog/domain/value-objects/jogo-id.vo.js';

class FakeAvatarStorage implements AvatarStorage {
  async save(playerId: string) {
    return `/uploads/avatars/${playerId}.jpg`;
  }
}

class FakeGameCoverStorage implements GameCoverStorage {
  async save(gameId: string) {
    return `/uploads/game-covers/${gameId}.jpg`;
  }
}

class InMemoryActivityLogRepository implements ActivityLogRepository {
  async create(): Promise<void> {}
  async listBySubject() { return []; }
  async listGlobal() { return []; }
  async listByAdminActivity() { return []; }
  async countRecentFailedLogins() { return 0; }
  async findLastLoginMetadata() { return null; }
}

class InMemoryCategoriaRepository implements CategoriaRepository {
  private readonly store = new Map<string, Categoria>();

  async save(categoria: Categoria): Promise<void> {
    this.store.set(categoria.id.toString(), categoria);
  }

  async findById(id: CategoriaId): Promise<Categoria | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async findBySlug(slug: Slug): Promise<Categoria | null> {
    for (const c of this.store.values()) {
      if (c.slug.equals(slug)) return c;
    }
    return null;
  }

  async listAll(): Promise<Categoria[]> {
    return [...this.store.values()];
  }

  async listActive(): Promise<Categoria[]> {
    return [...this.store.values()].filter((c) => c.active);
  }

  async countLinkedGames(id: CategoriaId): Promise<number> {
    return 0;
  }

  async delete(id: CategoriaId): Promise<void> {
    this.store.delete(id.toString());
  }
}

class InMemoryJogoRepository implements JogoRepository {
  private readonly store = new Map<string, Jogo>();

  async save(jogo: Jogo): Promise<void> {
    this.store.set(jogo.id.toString(), jogo);
  }

  async findById(id: JogoId): Promise<Jogo | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async findBySlug(slug: Slug): Promise<Jogo | null> {
    for (const j of this.store.values()) {
      if (j.slug.equals(slug)) return j;
    }
    return null;
  }

  async listByCategory(categoryId: string): Promise<Jogo[]> {
    return [...this.store.values()].filter((j) => j.categoryIds.includes(categoryId));
  }

  async search(query: string, limit = 8): Promise<Jogo[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return [...this.store.values()]
      .filter((j) => j.active && (j.name.toLowerCase().includes(q) || j.slug.toString().includes(q)))
      .slice(0, limit);
  }

  async delete(id: JogoId): Promise<void> {
    this.store.delete(id.toString());
  }
}

class InMemorySalaRepository implements SalaRepository {
  private readonly store = new Map<string, Sala>();
  private readonly byGameId = new Map<string, string>();

  async save(sala: Sala): Promise<void> {
    this.store.set(sala.id.toString(), sala);
    this.byGameId.set(sala.gameId, sala.id.toString());
  }

  async findById(id: SalaId) {
    return this.store.get(id.toString()) ?? null;
  }

  async findByGameId(gameId: string) {
    const roomId = this.byGameId.get(gameId);
    return roomId ? this.store.get(roomId) ?? null : null;
  }

  async listActiveByGame(gameId: string) {
    return [...this.store.values()].filter((s) => s.gameId === gameId);
  }

  async listActiveByCategory(_categoryId: string) {
    return [...this.store.values()];
  }

  async registrarParticipante(salaId: string, jogadorId: string): Promise<void> {
    const sala = this.store.get(salaId);
    if (!sala) return;
    if (!sala.temParticipante(jogadorId)) {
      sala.entrar(jogadorId);
    }
    this.store.set(salaId, sala);
  }

  async contarParticipantes(salaId: string): Promise<number> {
    const sala = this.store.get(salaId);
    return sala?.participantes.length ?? 0;
  }
}

class InMemoryMensagemRepository implements MensagemRepository {
  readonly messages: unknown[] = [];
  async save(m: unknown): Promise<void> {
    this.messages.push(m);
  }
  async listRecentByRoom(_roomId: string) {
    return [];
  }
  async deleteSentBefore(_cutoff: Date): Promise<number> {
    return 0;
  }
}

function createFixedLobby(input: {
  gameId: string;
  creatorId: string;
  title: string;
}): Sala {
  return Sala.reconstitute({
    id: SalaId.create(),
    gameId: input.gameId,
    creatorId: input.creatorId,
    title: RoomTitle.create(input.title),
    mode: ModoSalaVo.create('ONLINE'),
    capacity: Capacity.create(999),
    isFixed: true,
    status: RoomStatus.ABERTA,
    participantes: [],
    createdAt: new Date(),
  });
}

export async function buildTestApp(config?: Partial<AppConfig>) {
  const cfg = {
    DATABASE_URL: 'postgresql://test',
    JWT_SECRET: 'test-secret-min-16-chars',
    PORT: 0,
    HOST: '127.0.0.1',
    CORS_ORIGIN: '*',
    LOG_LEVEL: 'silent' as const,
    ...config,
  };

  const eventBus = new InMemoryEventBus();
  const jwt = new JwtService(cfg.JWT_SECRET);
  const chatHub = new ChatRoomHub();
  const jogadorRepo = new InMemoryJogadorRepository();
  const categoriaRepo = new InMemoryCategoriaRepository();
  const jogoRepo = new InMemoryJogoRepository();
  const salaRepo = new InMemorySalaRepository();
  const mensagemRepo = new InMemoryMensagemRepository();

  const fps = Categoria.create({ name: 'FPS', slug: 'fps' });
  await categoriaRepo.save(fps);
  const valorant = Jogo.create({
    name: 'Valorant',
    slug: 'valorant',
    categoryIds: [fps.id.toString()],
    supportedModes: [GameMode.ONLINE],
  });
  await jogoRepo.save(valorant);

  const fixedLobby = createFixedLobby({
    gameId: valorant.id.toString(),
    creatorId: 'system-user',
    title: 'Lobby — Valorant',
  });
  await salaRepo.save(fixedLobby);

  const gameCatalog = new InMemoryGameCatalogReader([
    {
      id: valorant.id.toString(),
      name: valorant.name,
      slug: valorant.slug.toString(),
      active: true,
      supportedModes: ['ONLINE'],
    },
  ]);

  const app = Fastify({ logger: false, genReqId: () => crypto.randomUUID() });
  await app.register(cors);
  await app.register(websocket);
  registerErrorHandler(app);
  registerAuthHook(app, jwt);

  app.get('/health', async () => ({ status: 'ok' }));

  const activityLogRepo = new InMemoryActivityLogRepository();
  const activityLogger = new ActivityLogger(activityLogRepo, jogadorRepo);
  const atualizarAvatar = new AtualizarAvatarUseCase(jogadorRepo);

  registerIdentityRoutes(app, {
    registrar: new RegistrarJogadorUseCase(jogadorRepo, passwordHasher, eventBus),
    autenticar: new AutenticarJogadorUseCase(jogadorRepo, passwordHasher),
    autenticarGoogle: new AutenticarGoogleUseCase(
      jogadorRepo,
      {
        verify: async () => ({
          googleId: 'google-1',
          email: 'g@test.com',
          displayName: 'Google User',
          avatarUrl: null,
        }),
      },
      eventBus,
    ),
    obterPerfil: new ObterPerfilUseCase(jogadorRepo),
    atualizarPerfil: new AtualizarPerfilUseCase(jogadorRepo),
    alterarEmail: new AlterarEmailUseCase(jogadorRepo, passwordHasher),
    alterarSenha: new AlterarSenhaUseCase(jogadorRepo, passwordHasher),
    uploadAvatar: new UploadAvatarUseCase(jogadorRepo, new FakeAvatarStorage(), atualizarAvatar),
    adicionarFavorito: new AdicionarJogoFavoritoUseCase(jogadorRepo, gameCatalog),
    removerFavorito: new RemoverJogoFavoritoUseCase(jogadorRepo),
    verificarEmail: new VerificarEmailUseCase(jogadorRepo),
    solicitarRecuperacaoSenha: new SolicitarRecuperacaoSenhaUseCase(
      jogadorRepo,
      new ConsoleEmailSender(),
      'http://localhost:5173',
    ),
    redefinirSenha: new RedefinirSenhaUseCase(jogadorRepo, passwordHasher),
    jwt,
    activityLogger,
    jogadorRepo,
  });

  registerAdminRoutes(app, {
    obterPainel: new ObterPainelAdminUseCase(jogadorRepo, {
      countGames: async () => 1,
      countCategories: async () => 1,
      countOnlinePlayers: async () => 0,
      countActiveRooms: async () => 0,
      countNewPlayersToday: async () => 0,
      countOpenReports: async () => 0,
    }),
    listarJogadores: new ListarJogadoresAdminUseCase(jogadorRepo),
    listarDenuncias: new ListarDenunciasAdminUseCase(jogadorRepo, async () => []),
    listarSalasAtivas: new ListarSalasAtivasAdminUseCase(jogadorRepo, async () => []),
    listarJogos: new ListarJogosAdminUseCase(jogadorRepo, async () => []),
    buscarJogadores: new BuscarJogadoresAdminUseCase(jogadorRepo),
    obterJogador: new ObterJogadorAdminUseCase(jogadorRepo),
    atualizarJogador: new AtualizarJogadorAdminUseCase(jogadorRepo),
    banirJogador: new BanirJogadorAdminUseCase(jogadorRepo),
    excluirJogador: new ExcluirJogadorAdminUseCase(jogadorRepo),
    cadastrarCategoria: new CadastrarCategoriaAdminUseCase(jogadorRepo, new CadastrarCategoriaUseCase(categoriaRepo)),
    excluirCategoria: new ExcluirCategoriaAdminUseCase(jogadorRepo, categoriaRepo),
    cadastrarJogo: new CadastrarJogoAdminUseCase(jogadorRepo, new CadastrarJogoUseCase(jogoRepo, categoriaRepo, eventBus)),
    excluirJogo: new ExcluirJogoAdminUseCase(jogadorRepo, jogoRepo),
    obterJogo: new ObterJogoAdminUseCase(jogadorRepo, jogoRepo),
    atualizarJogo: new AtualizarJogoAdminUseCase(jogadorRepo, new AtualizarJogoUseCase(jogoRepo)),
    uploadCapaJogo: new UploadCapaJogoAdminUseCase(
      jogadorRepo,
      new UploadCapaJogoUseCase(jogoRepo, new FakeGameCoverStorage()),
    ),
    alterarStatusJogo: new AlterarStatusJogoAdminUseCase(jogadorRepo, jogoRepo),
    alterarStatusCategoria: new AlterarStatusCategoriaAdminUseCase(jogadorRepo, categoriaRepo),
    obterCategoria: new ObterCategoriaAdminUseCase(jogadorRepo, categoriaRepo),
    atualizarCategoria: new AtualizarCategoriaAdminUseCase(
      jogadorRepo,
      new AtualizarCategoriaUseCase(categoriaRepo),
    ),
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
    enviarMensagem: new EnviarMensagemUseCase(
      salaRepo,
      mensagemRepo,
      jogadorRepo,
      eventBus,
      new RoomMessageCooldown(),
    ),
    chatHub,
  });

  await app.ready();
  return {
    app,
    seed: { fps, valorant, fixedLobby },
    mensagemRepo,
  };
}
