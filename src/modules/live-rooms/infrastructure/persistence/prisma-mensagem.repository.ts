import type { PrismaClient } from '@prisma/client';
import type { MensagemRepository } from '../../application/ports/sala.repository.js';
import type { Mensagem } from '../../domain/mensagem/mensagem.aggregate.js';
import { MensagemMapper } from './mensagem.mapper.js';

export class PrismaMensagemRepository implements MensagemRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(mensagem: Mensagem): Promise<void> {
    const data = MensagemMapper.toPersistence(mensagem);
    await this.prisma.mensagem.create({ data });
  }

  async listRecentByRoom(roomId: string, limit = 50) {
    const rows = await this.prisma.mensagem.findMany({
      where: { salaId: roomId },
      include: { author: true },
      orderBy: { sentAt: 'asc' },
      take: limit,
    });

    return rows.map((row) => ({
      messageId: row.id,
      roomId: row.salaId,
      authorId: row.authorId,
      authorDisplayName: row.author.displayName,
      authorRole: row.author.role,
      authorAvatarUrl: row.author.avatarUrl,
      content: row.content,
      sentAt: row.sentAt.toISOString(),
    }));
  }

  async deleteSentBefore(cutoff: Date): Promise<number> {
    const result = await this.prisma.mensagem.deleteMany({
      where: { sentAt: { lt: cutoff } },
    });
    return result.count;
  }
}
