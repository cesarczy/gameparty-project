import { ForbiddenError, NotFoundError } from '@shared/application/application.error.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import type { Jogador } from '../../domain/jogador/jogador.aggregate.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { PlayerRole, isAdminRole } from '../../domain/value-objects/player-role.vo.js';
import { resolveJogadorRank, rankToDto } from '../../domain/value-objects/player-rank.js';
import { assertPrimaryAdminProtected, isPrimaryAdmin } from '../../domain/value-objects/primary-admin.vo.js';

const SYSTEM_USER_EMAIL = 'system@gameparty.com.br';

function isSystemUser(jogador: Jogador): boolean {
  return jogador.email.toString() === SYSTEM_USER_EMAIL;
}

export interface ListarJogadoresAdminInput {
  requesterId: string;
}

export interface ListarJogadoresAdminOutput {
  players: Array<{
    playerId: string;
    username: string;
    email: string;
    displayName: string;
    role: string;
    avatarUrl: string | null;
    createdAt: string;
    isOnline: boolean;
    isBanned: boolean;
    isSystemAccount: boolean;
    isPrimaryAdmin: boolean;
    country: string | null;
    birthDate: string | null;
    language: string;
    emailVerified: boolean;
    chatOnline: boolean;
    rankId: string | null;
    rank: ReturnType<typeof rankToDto>;
  }>;
}

export class ListarJogadoresAdminUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: ListarJogadoresAdminInput): Promise<ListarJogadoresAdminOutput> {
    await this.assertAdmin(input.requesterId);
    const jogadores = await this.jogadorRepo.listAll();

    return {
      players: jogadores.map((j) => ({
        playerId: j.id.toString(),
        username: j.username.toString(),
        email: j.email.toString(),
        displayName: j.displayName.toString(),
        role: j.role,
        avatarUrl: j.avatarUrl,
        createdAt: j.createdAt.toISOString(),
        isOnline: isSystemUser(j) ? false : j.estaOnlineParaChat(),
        isBanned: j.estaBanido(),
        isSystemAccount: isSystemUser(j),
        isPrimaryAdmin: isPrimaryAdmin(j),
        country: j.country,
        birthDate: j.birthDate?.toISOString().slice(0, 10) ?? null,
        language: j.language,
        emailVerified: j.emailVerified,
        chatOnline: j.chatOnline,
        rankId: j.rankId,
        rank: rankToDto(
          resolveJogadorRank({
            createdAt: j.createdAt,
            role: j.role,
            rankId: j.rankId,
            isBanned: j.estaBanido(),
            username: j.username.toString(),
          }),
        ),
      })),
    };
  }

  private async assertAdmin(playerId: string) {
    const admin = await this.jogadorRepo.findById(JogadorId.create(playerId));
    if (!admin || !isAdminRole(admin.role)) {
      throw new ForbiddenError('Acesso restrito a administradores');
    }
  }
}

export interface DefinirRoleJogadorInput {
  requesterId: string;
  targetPlayerId: string;
  role: PlayerRole;
}

export class DefinirRoleJogadorUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: DefinirRoleJogadorInput): Promise<{ playerId: string; role: string }> {
    await this.assertAdmin(input.requesterId);

    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.targetPlayerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', input.targetPlayerId);
    }

    assertPrimaryAdminProtected(jogador);

    jogador.definirRole(input.role);
    await this.jogadorRepo.save(jogador);

    return { playerId: jogador.id.toString(), role: jogador.role };
  }

  private async assertAdmin(playerId: string) {
    const admin = await this.jogadorRepo.findById(JogadorId.create(playerId));
    if (!admin || !isAdminRole(admin.role)) {
      throw new ForbiddenError('Acesso restrito a administradores');
    }
  }
}

export interface ObterPainelAdminInput {
  requesterId: string;
}

export interface ObterPainelAdminOutput {
  stats: {
    totalPlayers: number;
    totalAdmins: number;
    totalGames: number;
    totalCategories: number;
    onlinePlayers: number;
    activeChats: number;
    newPlayersToday: number;
    openReports: number;
  };
}

export class ObterPainelAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly stats: {
      countGames(): Promise<number>;
      countCategories(): Promise<number>;
      countOnlinePlayers(): Promise<number>;
      countActiveRooms(): Promise<number>;
      countNewPlayersToday(): Promise<number>;
      countOpenReports(): Promise<number>;
    },
  ) {}

  async execute(input: ObterPainelAdminInput): Promise<ObterPainelAdminOutput> {
    const admin = await this.jogadorRepo.findById(JogadorId.create(input.requesterId));
    if (!admin || !isAdminRole(admin.role)) {
      throw new ForbiddenError('Acesso restrito a administradores');
    }

    const jogadores = await this.jogadorRepo.listAll();
    const [totalGames, totalCategories, onlinePlayers, activeChats, newPlayersToday, openReports] =
      await Promise.all([
      this.stats.countGames(),
      this.stats.countCategories(),
      this.stats.countOnlinePlayers(),
      this.stats.countActiveRooms(),
      this.stats.countNewPlayersToday(),
      this.stats.countOpenReports(),
    ]);

    return {
      stats: {
        totalPlayers: jogadores.filter((j) => !isSystemUser(j)).length,
        totalAdmins: jogadores.filter((j) => isAdminRole(j.role)).length,
        totalGames,
        totalCategories,
        onlinePlayers,
        activeChats,
        newPlayersToday,
        openReports,
      },
    };
  }
}

export interface ListarDenunciasAdminInput {
  requesterId: string;
}

export interface ListarDenunciasAdminOutput {
  reports: Array<{
    reportId: string;
    reason: string;
    details: string | null;
    status: string;
    createdAt: string;
    reporter: { playerId: string; displayName: string };
    reported: { playerId: string; displayName: string };
  }>;
}

export class ListarDenunciasAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly listOpenReports: () => Promise<ListarDenunciasAdminOutput['reports']>,
  ) {}

  async execute(input: ListarDenunciasAdminInput): Promise<ListarDenunciasAdminOutput> {
    await this.assertAdmin(input.requesterId);
    const reports = await this.listOpenReports();
    return { reports };
  }

  private async assertAdmin(playerId: string) {
    const admin = await this.jogadorRepo.findById(JogadorId.create(playerId));
    if (!admin || !isAdminRole(admin.role)) {
      throw new ForbiddenError('Acesso restrito a administradores');
    }
  }
}

export interface ListarSalasAtivasAdminInput {
  requesterId: string;
}

export interface ListarSalasAtivasAdminOutput {
  rooms: Array<{
    roomId: string;
    title: string;
    gameName: string;
    gameSlug: string;
    participantCount: number;
    participants: Array<{ playerId: string; displayName: string }>;
  }>;
}

export class ListarSalasAtivasAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly listActiveRooms: () => Promise<ListarSalasAtivasAdminOutput['rooms']>,
  ) {}

  async execute(input: ListarSalasAtivasAdminInput): Promise<ListarSalasAtivasAdminOutput> {
    await this.assertAdmin(input.requesterId);
    const rooms = await this.listActiveRooms();
    return { rooms };
  }

  private async assertAdmin(playerId: string) {
    const admin = await this.jogadorRepo.findById(JogadorId.create(playerId));
    if (!admin || !isAdminRole(admin.role)) {
      throw new ForbiddenError('Acesso restrito a administradores');
    }
  }
}

export interface ListarJogosAdminInput {
  requesterId: string;
}

export interface ListarJogosAdminOutput {
  games: Array<{
    gameId: string;
    name: string;
    slug: string;
    active: boolean;
  }>;
}

export class ListarJogosAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly listGames: () => Promise<ListarJogosAdminOutput['games']>,
  ) {}

  async execute(input: ListarJogosAdminInput): Promise<ListarJogosAdminOutput> {
    await this.assertAdmin(input.requesterId);
    const games = await this.listGames();
    return { games };
  }

  private async assertAdmin(playerId: string) {
    const admin = await this.jogadorRepo.findById(JogadorId.create(playerId));
    if (!admin || !isAdminRole(admin.role)) {
      throw new ForbiddenError('Acesso restrito a administradores');
    }
  }
}
