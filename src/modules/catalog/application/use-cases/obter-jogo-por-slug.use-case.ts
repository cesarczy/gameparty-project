import { NotFoundError } from '@shared/application/application.error.js';
import { Slug } from '../../domain/value-objects/slug.vo.js';
import type { JogoRepository } from '../ports/jogo.repository.js';

export interface ObterJogoPorSlugInput {
  slug: string;
}

export interface ObterJogoPorSlugOutput {
  gameId: string;
  name: string;
  slug: string;
  categoryIds: string[];
  supportedModes: string[];
  active: boolean;
}

export class ObterJogoPorSlugUseCase {
  constructor(private readonly jogoRepo: JogoRepository) {}

  async execute(input: ObterJogoPorSlugInput): Promise<ObterJogoPorSlugOutput> {
    const jogo = await this.jogoRepo.findBySlug(Slug.create(input.slug));
    if (!jogo) {
      throw new NotFoundError('Jogo', input.slug);
    }

    return {
      gameId: jogo.id.toString(),
      name: jogo.name,
      slug: jogo.slug.toString(),
      categoryIds: [...jogo.categoryIds],
      supportedModes: [...jogo.supportedModes],
      active: jogo.active,
    };
  }
}
