import type { PrismaClient } from '@prisma/client';
import type { GameCatalogReader } from '../../application/ports/game-catalog.reader.js';

export class PrismaGameCatalogReader implements GameCatalogReader {
  constructor(private readonly prisma: PrismaClient) {}

  async exists(gameId: string): Promise<boolean> {
    const count = await this.prisma.jogo.count({ where: { id: gameId, active: true } });
    return count > 0;
  }

  async getSnapshot(gameId: string) {
    const row = await this.prisma.jogo.findUnique({
      where: { id: gameId },
      include: { supportedModes: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      active: row.active,
      supportedModes: row.supportedModes.map((m) => m.mode),
    };
  }

  async supportsMode(gameId: string, mode: string): Promise<boolean> {
    const count = await this.prisma.jogoModo.count({
      where: { jogoId: gameId, mode: mode as 'ONLINE' | 'CAMPANHA' },
    });
    return count > 0;
  }
}
