import type { PrismaClient } from '@prisma/client';
import { RoomStatus } from '../../domain/value-objects/room-status.vo.js';
import type { SalaId } from '../../domain/value-objects/sala-id.vo.js';
import type { SalaRepository } from '../../application/ports/sala.repository.js';
import type { Sala } from '../../domain/sala/sala.aggregate.js';
import { SalaMapper } from './sala.mapper.js';

const include = { participantes: true } as const;
const activeStatuses = [RoomStatus.ABERTA, RoomStatus.CHEIA] as const;

export class PrismaSalaRepository implements SalaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(sala: Sala): Promise<void> {
    const data = SalaMapper.toPersistence(sala);
    await this.prisma.sala.upsert({
      where: { id: data.id },
      create: data,
      update: {
        title: data.title,
        capacity: data.capacity,
        isFixed: data.isFixed,
        status: data.status,
      },
    });

    await this.prisma.salaParticipante.deleteMany({ where: { salaId: data.id } });
    const unique = new Map<string, { jogadorId: string; joinedAt: Date }>();
    for (const p of sala.participantes) {
      unique.set(p.jogadorId, { jogadorId: p.jogadorId, joinedAt: p.joinedAt });
    }
    const participantes = [...unique.values()];
    if (participantes.length > 0) {
      await this.prisma.salaParticipante.createMany({
        data: participantes.map((p) => ({
          salaId: data.id,
          jogadorId: p.jogadorId,
          joinedAt: p.joinedAt,
        })),
        skipDuplicates: true,
      });
    }
  }

  async registrarParticipante(salaId: string, jogadorId: string): Promise<void> {
    await this.prisma.salaParticipante.upsert({
      where: {
        salaId_jogadorId: { salaId, jogadorId },
      },
      create: { salaId, jogadorId },
      update: {},
    });
  }

  async contarParticipantes(salaId: string): Promise<number> {
    return this.prisma.salaParticipante.count({ where: { salaId } });
  }

  async findById(id: SalaId): Promise<Sala | null> {
    const row = await this.prisma.sala.findUnique({
      where: { id: id.toString() },
      include,
    });
    return row ? SalaMapper.toDomain(row) : null;
  }

  async findByGameId(gameId: string): Promise<Sala | null> {
    const row = await this.prisma.sala.findUnique({
      where: { jogoId: gameId },
      include,
    });
    return row ? SalaMapper.toDomain(row) : null;
  }

  async listActiveByGame(gameId: string): Promise<Sala[]> {
    const rows = await this.prisma.sala.findMany({
      where: {
        jogoId: gameId,
        status: { in: [...activeStatuses] },
      },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(SalaMapper.toDomain);
  }

  async listActiveByCategory(categoryId: string): Promise<Sala[]> {
    const rows = await this.prisma.sala.findMany({
      where: {
        status: { in: [...activeStatuses] },
        jogo: { categorias: { some: { categoriaId: categoryId } } },
      },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(SalaMapper.toDomain);
  }
}
