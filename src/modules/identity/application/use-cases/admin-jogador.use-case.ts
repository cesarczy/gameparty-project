import {
  ApplicationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@shared/application/application.error.js';
import type { Jogador } from '../../domain/jogador/jogador.aggregate.js';
import { DisplayName } from '../../domain/value-objects/display-name.vo.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { PlayerRole, isAdminRole } from '../../domain/value-objects/player-role.vo.js';
import { resolveJogadorRank, rankToDto, findRankById } from '../../domain/value-objects/player-rank.js';
import { assertPrimaryAdminProtected, isPrimaryAdmin, isPrimaryAdminUsername } from '../../domain/value-objects/primary-admin.vo.js';
import { Username } from '../../domain/value-objects/username.vo.js';
import { SenhaHash } from '../../domain/value-objects/senha-hash.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';

const SYSTEM_USER_EMAIL = 'system@gameparty.com.br';

function normalizeRankId(
  rankId: string | null | undefined,
  jogador: Jogador,
): string | null | undefined {
  if (rankId === undefined) return undefined;
  if (rankId === null) return null;
  if (rankId === 'satoru-gojo' && !isPrimaryAdmin(jogador)) {
    throw new ApplicationError('A insígnia Satoru Gojo é exclusiva do administrador principal (@admin)');
  }
  if (!findRankById(rankId)) {
    throw new ApplicationError('Nível / insígnia inválido');
  }
  return rankId;
}

function isSystemUser(jogador: Jogador): boolean {
  return jogador.email.toString() === SYSTEM_USER_EMAIL;
}

function mapAdminPlayer(jogador: Jogador) {
  return {
    playerId: jogador.id.toString(),
    username: jogador.username.toString(),
    email: jogador.email.toString(),
    displayName: jogador.displayName.toString(),
    role: jogador.role,
    avatarUrl: jogador.avatarUrl,
    createdAt: jogador.createdAt.toISOString(),
    isOnline: isSystemUser(jogador) ? false : jogador.estaOnlineParaChat(),
    isBanned: jogador.estaBanido(),
    isSystemAccount: isSystemUser(jogador),
    isPrimaryAdmin: isPrimaryAdmin(jogador),
    country: jogador.country,
    birthDate: jogador.birthDate?.toISOString().slice(0, 10) ?? null,
    language: jogador.language,
    emailVerified: jogador.emailVerified,
    chatOnline: jogador.chatOnline,
    rankId: jogador.rankId,
    rank: rankToDto(
      resolveJogadorRank({
        createdAt: jogador.createdAt,
        role: jogador.role,
        rankId: jogador.rankId,
        isBanned: jogador.estaBanido(),
        username: jogador.username.toString(),
      }),
    ),
  };
}

async function assertAdmin(jogadorRepo: JogadorRepository, playerId: string) {
  const admin = await jogadorRepo.findById(JogadorId.create(playerId));
  if (!admin || !isAdminRole(admin.role)) {
    throw new ForbiddenError('Acesso restrito a administradores');
  }
}

async function assertUniqueFields(
  jogadorRepo: JogadorRepository,
  input: { username?: string; email?: string; displayName?: string },
  excludeId?: JogadorId,
) {
  if (input.username) {
    const username = Username.create(input.username);
    const existing = await jogadorRepo.findByUsername(username);
    if (existing && (!excludeId || !existing.id.equals(excludeId))) {
      throw new ConflictError('Nome de usuário já está em uso');
    }
  }
  if (input.email) {
    const email = Email.create(input.email);
    const existing = await jogadorRepo.findByEmail(email);
    if (existing && (!excludeId || !existing.id.equals(excludeId))) {
      throw new ConflictError('E-mail já cadastrado');
    }
  }
  if (input.displayName) {
    const displayName = DisplayName.create(input.displayName);
    const existing = await jogadorRepo.findByDisplayName(displayName, excludeId);
    if (existing) {
      throw new ConflictError('Nome de exibição já está em uso');
    }
  }
}

export class BuscarJogadoresAdminUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: { requesterId: string; q: string; limit?: number }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const jogadores = await this.jogadorRepo.search(input.q, input.limit ?? 8);
    return {
      players: jogadores.map((jogador) => ({
        playerId: jogador.id.toString(),
        username: jogador.username.toString(),
        displayName: jogador.displayName.toString(),
        email: jogador.email.toString(),
        avatarUrl: jogador.avatarUrl,
        isBanned: jogador.estaBanido(),
      })),
    };
  }
}

export class ObterJogadorAdminUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: { requesterId: string; targetPlayerId: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.targetPlayerId));
    if (!jogador) throw new NotFoundError('Jogador', input.targetPlayerId);
    return mapAdminPlayer(jogador);
  }
}

export class AtualizarJogadorAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly passwordHasher?: PasswordHasher,
  ) {}

  async execute(input: {
    requesterId: string;
    targetPlayerId: string;
    username?: string;
    email?: string;
    displayName?: string;
    role?: PlayerRole;
    country?: string | null;
    birthDate?: string | null;
    language?: string;
    emailVerified?: boolean;
    chatOnline?: boolean;
    senha?: string;
    rankId?: string | null;
  }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.targetPlayerId));
    if (!jogador) throw new NotFoundError('Jogador', input.targetPlayerId);

    assertPrimaryAdminProtected(jogador);

    if (input.username !== undefined && isPrimaryAdminUsername(input.username) && !isPrimaryAdmin(jogador)) {
      throw new ApplicationError('O usuário @admin é reservado ao administrador principal');
    }

    await assertUniqueFields(
      this.jogadorRepo,
      {
        username: input.username,
        email: input.email,
        displayName: input.displayName,
      },
      jogador.id,
    );

    jogador.atualizarPorAdmin({
      username: input.username,
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      country: input.country,
      birthDate:
        input.birthDate === undefined
          ? undefined
          : input.birthDate
            ? new Date(`${input.birthDate}T00:00:00`)
            : null,
      language: input.language,
      emailVerified: input.emailVerified,
      chatOnline: input.chatOnline,
      rankId: normalizeRankId(input.rankId, jogador),
    });

    if (input.senha && this.passwordHasher) {
      const hash = await this.passwordHasher.hash(input.senha);
      jogador.definirSenhaHash(SenhaHash.fromHash(hash));
    }

    await this.jogadorRepo.save(jogador);
    return mapAdminPlayer(jogador);
  }
}

export class BanirJogadorAdminUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: { requesterId: string; targetPlayerId: string; banned: boolean }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.targetPlayerId));
    if (!jogador) throw new NotFoundError('Jogador', input.targetPlayerId);

    assertPrimaryAdminProtected(jogador);

    if (jogador.email.toString() === SYSTEM_USER_EMAIL) {
      throw new ApplicationError('Não é possível banir a conta do sistema');
    }

    if (input.banned) {
      jogador.ban();
    } else {
      jogador.desbanir();
    }

    await this.jogadorRepo.save(jogador);
    return { playerId: jogador.id.toString(), isBanned: jogador.estaBanido() };
  }
}

export class ExcluirJogadorAdminUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: { requesterId: string; targetPlayerId: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);

    if (input.requesterId === input.targetPlayerId) {
      throw new ApplicationError('Você não pode excluir sua própria conta por aqui');
    }

    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.targetPlayerId));
    if (!jogador) throw new NotFoundError('Jogador', input.targetPlayerId);

    assertPrimaryAdminProtected(jogador);

    if (jogador.email.toString() === SYSTEM_USER_EMAIL) {
      throw new ApplicationError('Não é possível excluir a conta do sistema');
    }

    await this.jogadorRepo.delete(jogador.id);
    return { playerId: input.targetPlayerId, deleted: true };
  }
}
