import { NotFoundError } from '@shared/application/application.error.js';
import { JogoId } from '../../domain/value-objects/jogo-id.vo.js';
import type { JogoRepository } from '../ports/jogo.repository.js';
import type { GameCoverStorage } from '../ports/game-cover-storage.port.js';

export interface UploadCapaJogoInput {
  gameId: string;
  buffer: Buffer;
  mimetype: string;
}

export class UploadCapaJogoUseCase {
  constructor(
    private readonly jogoRepo: JogoRepository,
    private readonly coverStorage: GameCoverStorage,
  ) {}

  async execute(input: UploadCapaJogoInput) {
    const jogo = await this.jogoRepo.findById(JogoId.create(input.gameId));
    if (!jogo) {
      throw new NotFoundError('Jogo', input.gameId);
    }

    const coverUrl = await this.coverStorage.save(input.gameId, {
      buffer: input.buffer,
      mimetype: input.mimetype,
    });

    jogo.definirCoverUrl(coverUrl);
    await this.jogoRepo.save(jogo);

    return {
      gameId: jogo.id.toString(),
      coverUrl,
    };
  }
}
