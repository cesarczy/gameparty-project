import { ConflictError } from '@shared/application/application.error.js';
import { Categoria } from '../../domain/categoria/categoria.aggregate.js';
import { Slug } from '../../domain/value-objects/slug.vo.js';
import type { CategoriaRepository } from '../ports/categoria.repository.js';

export interface CadastrarCategoriaInput {
  name: string;
  slug: string;
}

export interface CadastrarCategoriaOutput {
  categoryId: string;
  name: string;
  slug: string;
}

export class CadastrarCategoriaUseCase {
  constructor(private readonly categoriaRepo: CategoriaRepository) {}

  async execute(input: CadastrarCategoriaInput): Promise<CadastrarCategoriaOutput> {
    const slug = Slug.create(input.slug);
    const existing = await this.categoriaRepo.findBySlug(slug);
    if (existing) {
      throw new ConflictError(`Categoria com slug "${slug.toString()}" já existe`);
    }

    const categoria = Categoria.create(input);
    await this.categoriaRepo.save(categoria);

    return {
      categoryId: categoria.id.toString(),
      name: categoria.name,
      slug: categoria.slug.toString(),
    };
  }
}
