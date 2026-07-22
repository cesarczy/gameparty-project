import type {
  Jogo as PrismaJogo,
  JogoModo,
  JogoCategoria,
} from '@prisma/client';
import { Jogo } from '../../domain/jogo/jogo.aggregate.js';
import { GameMode } from '../../domain/value-objects/game-mode.vo.js';
import { JogoId } from '../../domain/value-objects/jogo-id.vo.js';
import { Slug } from '../../domain/value-objects/slug.vo.js';

type JogoWithRelations = PrismaJogo & {
  supportedModes: JogoModo[];
  categorias: JogoCategoria[];
};

export class JogoMapper {
  static toDomain(row: JogoWithRelations): Jogo {
    return Jogo.reconstitute({
      id: JogoId.create(row.id),
      name: row.name,
      slug: Slug.create(row.slug),
      categoryIds: row.categorias.map((c) => c.categoriaId),
      supportedModes: row.supportedModes.map((m) => m.mode as GameMode),
      active: row.active,
    });
  }

  static toPersistence(jogo: Jogo) {
    return {
      id: jogo.id.toString(),
      name: jogo.name,
      slug: jogo.slug.toString(),
      active: jogo.active,
    };
  }
}
