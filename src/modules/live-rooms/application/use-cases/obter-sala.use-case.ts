import { NotFoundError } from '@shared/application/application.error.js';
import { resolveGameCoverFallback, resolveGameCoverUrl } from '@catalog/infrastructure/game-covers.js';
import type { JogoRepository } from '@catalog/application/ports/jogo.repository.js';
import { JogoId } from '@catalog/domain/value-objects/jogo-id.vo.js';
import type { SalaRepository } from '../ports/sala.repository.js';
import { SalaId } from '../../domain/value-objects/sala-id.vo.js';

export interface ObterSalaInput {
  roomId: string;
}

export interface ObterSalaOutput {
  roomId: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  coverUrl: string;
  title: string;
  participantCount: number;
}

export class ObterSalaUseCase {
  constructor(
    private readonly salaRepo: SalaRepository,
    private readonly jogoRepo: JogoRepository,
  ) {}

  async execute(input: ObterSalaInput): Promise<ObterSalaOutput> {
    const sala = await this.salaRepo.findById(SalaId.create(input.roomId));
    if (!sala) {
      throw new NotFoundError('Sala', input.roomId);
    }

    const jogo = await this.jogoRepo.findById(JogoId.create(sala.gameId));
    if (!jogo) {
      throw new NotFoundError('Jogo', sala.gameId);
    }

    const slug = jogo.slug.toString();
    const coverUrl = resolveGameCoverUrl(slug) ?? resolveGameCoverFallback(jogo.name);

    return {
      roomId: sala.id.toString(),
      gameId: jogo.id.toString(),
      gameName: jogo.name,
      gameSlug: slug,
      coverUrl,
      title: sala.title.toString(),
      participantCount: sala.participantes.length,
    };
  }
}
