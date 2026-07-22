import type { Categoria } from '../../domain/categoria/categoria.aggregate.js';
import type { CategoriaId } from '../../domain/value-objects/categoria-id.vo.js';
import type { Slug } from '../../domain/value-objects/slug.vo.js';

export interface CategoriaRepository {
  save(categoria: Categoria): Promise<void>;
  findById(id: CategoriaId): Promise<Categoria | null>;
  findBySlug(slug: Slug): Promise<Categoria | null>;
  listAll(): Promise<Categoria[]>;
  listActive(): Promise<Categoria[]>;
  countLinkedGames(id: CategoriaId): Promise<number>;
  delete(id: CategoriaId): Promise<void>;
}
