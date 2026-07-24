import { ConflictError, NotFoundError } from '@shared/application/application.error.js';
import { Slug } from '../../domain/value-objects/slug.vo.js';
import { JogoId } from '../../domain/value-objects/jogo-id.vo.js';
import type { JogoRepository } from '../ports/jogo.repository.js';

export interface AtualizarJogoInput {
  gameId: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface AtualizarJogoOutput {
  gameId: string;
  name: string;
  slug: string;
  coverUrl: string | null;
  active: boolean;
}

export class AtualizarJogoUseCase {
  constructor(private readonly jogoRepo: JogoRepository) {}

  async execute(input: AtualizarJogoInput): Promise<AtualizarJogoOutput> {
    const jogo = await this.jogoRepo.findById(JogoId.create(input.gameId));
    if (!jogo) {
      throw new NotFoundError('Jogo', input.gameId);
    }

    const slug = Slug.create(input.slug);
    const slugOwner = await this.jogoRepo.findBySlug(slug);
    if (slugOwner && slugOwner.id.toString() !== input.gameId) {
      throw new ConflictError(`Jogo com slug "${slug.toString()}" já existe`);
    }

    jogo.atualizarIdentidade({ name: input.name, slug: input.slug });
    if (input.active) {
      jogo.ativar();
    } else {
      jogo.desativar();
    }

    await this.jogoRepo.save(jogo);

    return {
      gameId: jogo.id.toString(),
      name: jogo.name,
      slug: jogo.slug.toString(),
      coverUrl: jogo.coverUrl,
      active: jogo.active,
    };
  }
}
