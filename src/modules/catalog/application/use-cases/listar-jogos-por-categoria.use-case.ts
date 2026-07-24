import type { JogoRepository } from '../ports/jogo.repository.js';
import type { SalaRepository } from '@live-rooms/application/ports/sala.repository.js';
import { resolveGameCoverForJogo } from '../../infrastructure/game-covers.js';

export interface ListarJogosPorCategoriaInput {
  categoryId: string;
}

export interface ListarJogosPorCategoriaOutput {
  games: Array<{
    gameId: string;
    name: string;
    slug: string;
    supportedModes: string[];
    active: boolean;
    lobbyRoomId: string | null;
    coverUrl: string;
  }>;
}

export class ListarJogosPorCategoriaUseCase {
  constructor(
    private readonly jogoRepo: JogoRepository,
    private readonly salaRepo: SalaRepository,
  ) {}

  async execute(input: ListarJogosPorCategoriaInput): Promise<ListarJogosPorCategoriaOutput> {
    const jogos = await this.jogoRepo.listByCategory(input.categoryId);
    const games = await Promise.all(
      jogos.map(async (j) => {
        const slug = j.slug.toString();
        const sala = await this.salaRepo.findByGameId(j.id.toString());
        return {
          gameId: j.id.toString(),
          name: j.name,
          slug,
          supportedModes: [...j.supportedModes],
          active: j.active,
          lobbyRoomId: sala?.id.toString() ?? null,
          coverUrl: resolveGameCoverForJogo({ slug, name: j.name, coverUrl: j.coverUrl }),
        };
      }),
    );
    return { games };
  }
}
