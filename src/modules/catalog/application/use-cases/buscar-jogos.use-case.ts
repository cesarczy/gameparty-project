import type { JogoRepository } from '../ports/jogo.repository.js';
import type { SalaRepository } from '@live-rooms/application/ports/sala.repository.js';
import {
  resolveGameCoverForJogo,
} from '../../infrastructure/game-covers.js';

export interface BuscarJogosInput {
  q: string;
  limit?: number;
}

export interface BuscarJogosOutput {
  games: Array<{
    gameId: string;
    name: string;
    slug: string;
    lobbyRoomId: string | null;
    coverUrl: string;
  }>;
}

export class BuscarJogosUseCase {
  constructor(
    private readonly jogoRepo: JogoRepository,
    private readonly salaRepo: SalaRepository,
  ) {}

  async execute(input: BuscarJogosInput): Promise<BuscarJogosOutput> {
    const jogos = await this.jogoRepo.search(input.q, input.limit ?? 8);
    const games = await Promise.all(
      jogos.map(async (j) => {
        const slug = j.slug.toString();
        const sala = await this.salaRepo.findByGameId(j.id.toString());
        return {
          gameId: j.id.toString(),
          name: j.name,
          slug,
          lobbyRoomId: sala?.id.toString() ?? null,
          coverUrl: resolveGameCoverForJogo({ slug, name: j.name, coverUrl: j.coverUrl }),
        };
      }),
    );
    return { games };
  }
}
