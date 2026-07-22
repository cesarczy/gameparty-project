import type { MensagemRepository } from '../ports/sala.repository.js';

export interface PurgeOldRoomMessagesInput {
  retentionDays: number;
  now?: Date;
}

export interface PurgeOldRoomMessagesOutput {
  deletedCount: number;
  cutoff: string;
}

export class PurgeOldRoomMessagesUseCase {
  constructor(private readonly mensagemRepo: MensagemRepository) {}

  async execute(input: PurgeOldRoomMessagesInput): Promise<PurgeOldRoomMessagesOutput> {
    if (input.retentionDays <= 0) {
      return { deletedCount: 0, cutoff: new Date().toISOString() };
    }

    const now = input.now ?? new Date();
    const cutoff = new Date(now.getTime() - input.retentionDays * 24 * 60 * 60 * 1000);
    const deletedCount = await this.mensagemRepo.deleteSentBefore(cutoff);

    return {
      deletedCount,
      cutoff: cutoff.toISOString(),
    };
  }
}
