import { ConflictError, NotFoundError } from '@shared/application/application.error.js';
import { Slug } from '../../domain/value-objects/slug.vo.js';
import { CategoriaId } from '../../domain/value-objects/categoria-id.vo.js';
import type { CategoriaRepository } from '../ports/categoria.repository.js';

export interface AtualizarCategoriaInput {
  categoryId: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface AtualizarCategoriaOutput {
  categoryId: string;
  name: string;
  slug: string;
  active: boolean;
}

export class AtualizarCategoriaUseCase {
  constructor(private readonly categoriaRepo: CategoriaRepository) {}

  async execute(input: AtualizarCategoriaInput): Promise<AtualizarCategoriaOutput> {
    const categoria = await this.categoriaRepo.findById(CategoriaId.create(input.categoryId));
    if (!categoria) {
      throw new NotFoundError('Categoria', input.categoryId);
    }

    const slug = Slug.create(input.slug);
    const slugOwner = await this.categoriaRepo.findBySlug(slug);
    if (slugOwner && slugOwner.id.toString() !== input.categoryId) {
      throw new ConflictError(`Categoria com slug "${slug.toString()}" já existe`);
    }

    categoria.atualizarIdentidade({ name: input.name, slug: input.slug });
    if (input.active) {
      categoria.ativar();
    } else {
      categoria.desativar();
    }

    await this.categoriaRepo.save(categoria);

    return {
      categoryId: categoria.id.toString(),
      name: categoria.name,
      slug: categoria.slug.toString(),
      active: categoria.active,
    };
  }
}
