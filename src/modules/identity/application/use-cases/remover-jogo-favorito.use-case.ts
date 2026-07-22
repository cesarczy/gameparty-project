import { NotFoundError } from '@shared/application/application.error.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';

export interface RemoverJogoFavoritoInput {
  playerId: string;
  gameId: string;
}

export interface RemoverJogoFavoritoOutput {
  playerId: string;
  favoritos: string[];
}

export class RemoverJogoFavoritoUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: RemoverJogoFavoritoInput): Promise<RemoverJogoFavoritoOutput> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', input.playerId);
    }

    jogador.removerFavorito(input.gameId);
    await this.jogadorRepo.save(jogador);

    return {
      playerId: jogador.id.toString(),
      favoritos: [...jogador.favoritos],
    };
  }
}
