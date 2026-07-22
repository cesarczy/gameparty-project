import type { Categoria as PrismaCategoria } from '@prisma/client';
import { Categoria } from '../../domain/categoria/categoria.aggregate.js';
import { CategoriaId } from '../../domain/value-objects/categoria-id.vo.js';
import { Slug } from '../../domain/value-objects/slug.vo.js';

export class CategoriaMapper {
  static toDomain(row: PrismaCategoria): Categoria {
    return Categoria.reconstitute({
      id: CategoriaId.create(row.id),
      name: row.name,
      slug: Slug.create(row.slug),
      active: row.active,
    });
  }

  static toPersistence(categoria: Categoria) {
    return {
      id: categoria.id.toString(),
      name: categoria.name,
      slug: categoria.slug.toString(),
      active: categoria.active,
    };
  }
}
