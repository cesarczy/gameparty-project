import type { GameCatalogReader } from '@catalog/application/ports/game-catalog.reader.js';
import { NotFoundError } from '@shared/application/application.error.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';

export interface AdicionarJogoFavoritoInput {
  playerId: string;
  gameId: string;
}

export interface AdicionarJogoFavoritoOutput {
  playerId: string;
  favoritos: string[];
}

export class AdicionarJogoFavoritoUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly gameCatalog: GameCatalogReader,
  ) {}

  async execute(input: AdicionarJogoFavoritoInput): Promise<AdicionarJogoFavoritoOutput> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', input.playerId);
    }

    const gameExists = await this.gameCatalog.exists(input.gameId);
    if (!gameExists) {
      throw new NotFoundError('Jogo', input.gameId);
    }

    jogador.adicionarFavorito(input.gameId);
    await this.jogadorRepo.save(jogador);

    return {
      playerId: jogador.id.toString(),
      favoritos: [...jogador.favoritos],
    };
  }
}
