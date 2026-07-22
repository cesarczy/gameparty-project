import { NotFoundError } from '@shared/application/application.error.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';

export interface AtualizarAvatarInput {
  playerId: string;
  avatarUrl: string | null;
}

export interface AtualizarAvatarOutput {
  playerId: string;
  avatarUrl: string | null;
}

export class AtualizarAvatarUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: AtualizarAvatarInput): Promise<AtualizarAvatarOutput> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', input.playerId);
    }

    jogador.atualizarAvatar(input.avatarUrl);
    await this.jogadorRepo.save(jogador);

    return {
      playerId: jogador.id.toString(),
      avatarUrl: jogador.avatarUrl,
    };
  }
}
