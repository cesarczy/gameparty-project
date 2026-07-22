import { describe, expect, it } from 'vitest';
import type { MensagemRepository } from '../../src/modules/live-rooms/application/ports/sala.repository.js';
import { PurgeOldRoomMessagesUseCase } from '../../src/modules/live-rooms/application/use-cases/purge-old-room-messages.use-case.js';

class FakeMensagemRepository implements MensagemRepository {
  cutoff: Date | null = null;

  async save(): Promise<void> {
    return undefined;
  }

  async listRecentByRoom() {
    return [];
  }

  async deleteSentBefore(cutoff: Date): Promise<number> {
    this.cutoff = cutoff;
    return 42;
  }
}

describe('PurgeOldRoomMessagesUseCase', () => {
  it('apaga mensagens anteriores ao cutoff de retenção', async () => {
    const repo = new FakeMensagemRepository();
    const useCase = new PurgeOldRoomMessagesUseCase(repo);
    const now = new Date('2026-07-22T12:00:00.000Z');

    const result = await useCase.execute({ retentionDays: 90, now });

    expect(result.deletedCount).toBe(42);
    expect(result.cutoff).toBe('2026-04-23T12:00:00.000Z');
    expect(repo.cutoff?.toISOString()).toBe('2026-04-23T12:00:00.000Z');
  });

  it('não executa purge quando retenção está desativada', async () => {
    const repo = new FakeMensagemRepository();
    const useCase = new PurgeOldRoomMessagesUseCase(repo);

    const result = await useCase.execute({ retentionDays: 0 });

    expect(result.deletedCount).toBe(0);
    expect(repo.cutoff).toBeNull();
  });
});
