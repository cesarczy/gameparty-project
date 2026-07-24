import { ApplicationError, NotFoundError } from '@shared/application/application.error.js';
import type { JogoRepository } from '@catalog/application/ports/jogo.repository.js';
import type { SalaRepository } from '@live-rooms/application/ports/sala.repository.js';
import { Slug } from '@catalog/domain/value-objects/slug.vo.js';

export interface ObterLobbyPorSlugInput {
  slug: string;
}

export interface ObterLobbyPorSlugOutput {
  roomId: string;
  gameId: string;
  gameName: string;
  title: string;
  participantCount: number;
}

export class ObterLobbyPorSlugUseCase {
  constructor(
    private readonly jogoRepo: JogoRepository,
    private readonly salaRepo: SalaRepository,
  ) {}

  async execute(input: ObterLobbyPorSlugInput): Promise<ObterLobbyPorSlugOutput> {
    const jogo = await this.jogoRepo.findBySlug(Slug.create(input.slug));
    if (!jogo) {
      throw new NotFoundError('Jogo', input.slug);
    }

    if (!jogo.active) {
      throw new ApplicationError('O chat deste jogo está desativado.');
    }

    const sala = await this.salaRepo.findByGameId(jogo.id.toString());
    if (!sala) {
      throw new NotFoundError('Lobby', input.slug);
    }

    return {
      roomId: sala.id.toString(),
      gameId: jogo.id.toString(),
      gameName: jogo.name,
      title: sala.title.toString(),
      participantCount: sala.participantes.length,
    };
  }
}
