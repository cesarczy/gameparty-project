import type { PrismaClient } from '@prisma/client';
import type { CategoriaRepository } from '../../application/ports/categoria.repository.js';
import type { CategoriaId } from '../../domain/value-objects/categoria-id.vo.js';
import type { Slug } from '../../domain/value-objects/slug.vo.js';
import type { Categoria } from '../../domain/categoria/categoria.aggregate.js';
import { CategoriaMapper } from './categoria.mapper.js';

export class PrismaCategoriaRepository implements CategoriaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(categoria: Categoria): Promise<void> {
    const data = CategoriaMapper.toPersistence(categoria);
    await this.prisma.categoria.upsert({
      where: { id: data.id },
      create: data,
      update: { name: data.name, slug: data.slug, active: data.active },
    });
  }

  async findById(id: CategoriaId): Promise<Categoria | null> {
    const row = await this.prisma.categoria.findUnique({ where: { id: id.toString() } });
    return row ? CategoriaMapper.toDomain(row) : null;
  }

  async findBySlug(slug: Slug): Promise<Categoria | null> {
    const row = await this.prisma.categoria.findUnique({ where: { slug: slug.toString() } });
    return row ? CategoriaMapper.toDomain(row) : null;
  }

  async listAll(): Promise<Categoria[]> {
    const rows = await this.prisma.categoria.findMany({ orderBy: { name: 'asc' } });
    return rows.map(CategoriaMapper.toDomain);
  }

  async listActive(): Promise<Categoria[]> {
    const rows = await this.prisma.categoria.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return rows.map(CategoriaMapper.toDomain);
  }

  async countLinkedGames(id: CategoriaId): Promise<number> {
    return this.prisma.jogoCategoria.count({ where: { categoriaId: id.toString() } });
  }

  async delete(id: CategoriaId): Promise<void> {
    await this.prisma.categoria.delete({ where: { id: id.toString() } });
  }
}
