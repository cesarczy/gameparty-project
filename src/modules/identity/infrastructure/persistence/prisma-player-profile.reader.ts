import type { PrismaClient } from '@prisma/client';
import type { PlayerProfileReader } from '../../application/ports/player-profile.reader.js';

export class PrismaPlayerProfileReader implements PlayerProfileReader {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(playerId: string) {
    const row = await this.prisma.jogador.findUnique({
      where: { id: playerId },
      select: { id: true, displayName: true },
    });
    if (!row) return null;
    return { id: row.id, displayName: row.displayName };
  }
}
