import { UnauthorizedError } from '@shared/application/application.error.js';
import { resolveJogadorRank, rankToDto } from '../../domain/value-objects/player-rank.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';

export interface ObterPerfilInput {
  playerId: string;
}

export interface ObterPerfilOutput {
  playerId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
  hasPassword: boolean;
  canChangeDisplayName: boolean;
  nextDisplayNameChangeAt: string | null;
  canChangeEmail: boolean;
  nextEmailChangeAt: string | null;
  favoritos: string[];
  profanityFilterEnabled: boolean;
  chatOnline: boolean;
  theme: string;
  language: string;
  rank: { id: string; label: string; badge: string; badgeImageUrl: string | null; minDays: number };
  rankId: string | null;
}

export class ObterPerfilUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: ObterPerfilInput): Promise<ObterPerfilOutput> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new UnauthorizedError('Sessão inválida. Faça login novamente.');
    }

    if (jogador.touchPresence()) {
      await this.jogadorRepo.save(jogador);
    }

    return {
      playerId: jogador.id.toString(),
      email: jogador.email.toString(),
      displayName: jogador.displayName.toString(),
      avatarUrl: jogador.avatarUrl,
      role: jogador.role,
      hasPassword: jogador.exigeSenhaLocal(),
      canChangeDisplayName: jogador.podeAlterarDisplayName(),
      nextDisplayNameChangeAt: jogador.podeAlterarDisplayName()
        ? null
        : jogador.proximaAlteracaoDisplayName().toISOString(),
      canChangeEmail: jogador.podeAlterarEmail(),
      nextEmailChangeAt: jogador.podeAlterarEmail()
        ? null
        : jogador.proximaAlteracaoEmail().toISOString(),
      favoritos: [...jogador.favoritos],
      profanityFilterEnabled: jogador.profanityFilterEnabled,
      chatOnline: jogador.chatOnline,
      theme: jogador.theme,
      language: jogador.language,
      rank: rankToDto(
        resolveJogadorRank({
          createdAt: jogador.createdAt,
          role: jogador.role,
          rankId: jogador.rankId,
          isBanned: jogador.estaBanido(),
          username: jogador.username.toString(),
        }),
      ),
      rankId: jogador.rankId,
    };
  }
}
