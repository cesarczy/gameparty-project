import type { CategoriaRepository } from '../ports/categoria.repository.js';

export interface ListarCategoriasOutput {
  categories: Array<{
    categoryId: string;
    name: string;
    slug: string;
  }>;
}

export class ListarCategoriasUseCase {
  constructor(private readonly categoriaRepo: CategoriaRepository) {}

  async execute(): Promise<ListarCategoriasOutput> {
    const categorias = await this.categoriaRepo.listActive();
    return {
      categories: categorias.map((c) => ({
        categoryId: c.id.toString(),
        name: c.name,
        slug: c.slug.toString(),
      })),
    };
  }
}
