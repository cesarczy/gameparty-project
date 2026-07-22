import type { Jogo } from '../../domain/jogo/jogo.aggregate.js';
import type { JogoId } from '../../domain/value-objects/jogo-id.vo.js';
import type { Slug } from '../../domain/value-objects/slug.vo.js';

export interface JogoRepository {
  save(jogo: Jogo): Promise<void>;
  findById(id: JogoId): Promise<Jogo | null>;
  findBySlug(slug: Slug): Promise<Jogo | null>;
  listByCategory(categoryId: string): Promise<Jogo[]>;
  search(query: string, limit?: number): Promise<Jogo[]>;
  delete(id: JogoId): Promise<void>;
}
