import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { ConflictError, NotFoundError } from '@shared/application/application.error.js';
import { Jogo } from '../../domain/jogo/jogo.aggregate.js';
import { CategoriaId } from '../../domain/value-objects/categoria-id.vo.js';
import type { GameMode } from '../../domain/value-objects/game-mode.vo.js';
import { Slug } from '../../domain/value-objects/slug.vo.js';
import type { CategoriaRepository } from '../ports/categoria.repository.js';
import type { JogoRepository } from '../ports/jogo.repository.js';

export interface CadastrarJogoInput {
  name: string;
  slug: string;
  categoryIds: string[];
  supportedModes: GameMode[];
}

export interface CadastrarJogoOutput {
  gameId: string;
  name: string;
  slug: string;
}

export class CadastrarJogoUseCase {
  constructor(
    private readonly jogoRepo: JogoRepository,
    private readonly categoriaRepo: CategoriaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CadastrarJogoInput): Promise<CadastrarJogoOutput> {
    const slug = Slug.create(input.slug);
    const existing = await this.jogoRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError(`Jogo com slug "${slug.toString()}" já existe`);
    }

    for (const categoryId of input.categoryIds) {
      const categoria = await this.categoriaRepo.findById(CategoriaId.create(categoryId));
      if (!categoria) {
        throw new NotFoundError('Categoria', categoryId);
      }
    }

    const jogo = Jogo.create(input);
    await this.jogoRepo.save(jogo);
    await this.eventBus.publishAll(jogo.pullDomainEvents());

    return {
      gameId: jogo.id.toString(),
      name: jogo.name,
      slug: jogo.slug.toString(),
    };
  }
}
