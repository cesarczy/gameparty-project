import type { PrismaClient } from '@prisma/client';
import type { JogoRepository } from '../../application/ports/jogo.repository.js';
import type { JogoId } from '../../domain/value-objects/jogo-id.vo.js';
import type { Slug } from '../../domain/value-objects/slug.vo.js';
import type { Jogo } from '../../domain/jogo/jogo.aggregate.js';
import { JogoMapper } from './jogo.mapper.js';

const include = { supportedModes: true, categorias: true } as const;

export class PrismaJogoRepository implements JogoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(jogo: Jogo): Promise<void> {
    const data = JogoMapper.toPersistence(jogo);
    await this.prisma.jogo.upsert({
      where: { id: data.id },
      create: data,
      update: { name: data.name, slug: data.slug, active: data.active },
    });

    await this.prisma.jogoModo.deleteMany({ where: { jogoId: data.id } });
    await this.prisma.jogoModo.createMany({
      data: jogo.supportedModes.map((mode) => ({ jogoId: data.id, mode })),
    });

    await this.prisma.jogoCategoria.deleteMany({ where: { jogoId: data.id } });
    if (jogo.categoryIds.length > 0) {
      await this.prisma.jogoCategoria.createMany({
        data: jogo.categoryIds.map((categoriaId) => ({
          jogoId: data.id,
          categoriaId,
        })),
      });
    }
  }

  async findById(id: JogoId): Promise<Jogo | null> {
    const row = await this.prisma.jogo.findUnique({
      where: { id: id.toString() },
      include,
    });
    return row ? JogoMapper.toDomain(row) : null;
  }

  async findBySlug(slug: Slug): Promise<Jogo | null> {
    const row = await this.prisma.jogo.findUnique({
      where: { slug: slug.toString() },
      include,
    });
    return row ? JogoMapper.toDomain(row) : null;
  }

  async listByCategory(categoryId: string): Promise<Jogo[]> {
    const rows = await this.prisma.jogo.findMany({
      where: { categorias: { some: { categoriaId: categoryId } }, active: true },
      include,
      orderBy: { name: 'asc' },
    });
    return rows.map(JogoMapper.toDomain);
  }

  async search(query: string, limit = 8): Promise<Jogo[]> {
    const q = query.trim();
    if (q.length < 2) return [];
    const rows = await this.prisma.jogo.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      include,
      orderBy: { name: 'asc' },
      take: limit,
    });
    return rows.map(JogoMapper.toDomain);
  }

  async delete(id: JogoId): Promise<void> {
    const gameId = id.toString();
    await this.prisma.$transaction(async (tx) => {
      const sala = await tx.sala.findUnique({ where: { jogoId: gameId } });
      if (sala) {
        await tx.mensagem.deleteMany({ where: { salaId: sala.id } });
        await tx.salaParticipante.deleteMany({ where: { salaId: sala.id } });
        await tx.sala.delete({ where: { id: sala.id } });
      }
      await tx.jogoModo.deleteMany({ where: { jogoId: gameId } });
      await tx.jogoCategoria.deleteMany({ where: { jogoId: gameId } });
      await tx.jogadorFavorito.deleteMany({ where: { jogoId: gameId } });
      await tx.jogo.delete({ where: { id: gameId } });
    });
  }
}
