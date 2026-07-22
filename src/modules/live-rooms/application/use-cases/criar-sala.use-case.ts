import type { GameCatalogReader } from '@catalog/application/ports/game-catalog.reader.js';
import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { ForbiddenError, NotFoundError } from '@shared/application/application.error.js';
import { Sala } from '../../domain/sala/sala.aggregate.js';
import type { SalaRepository } from '../ports/sala.repository.js';

export interface CriarSalaInput {
  gameId: string;
  creatorId: string;
  title: string;
  mode: string;
  capacity: number;
}

export interface CriarSalaOutput {
  roomId: string;
  gameId: string;
  title: string;
  mode: string;
  status: string;
}

export class CriarSalaUseCase {
  constructor(
    private readonly salaRepo: SalaRepository,
    private readonly gameCatalog: GameCatalogReader,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: CriarSalaInput): Promise<CriarSalaOutput> {
    const snapshot = await this.gameCatalog.getSnapshot(input.gameId);
    if (!snapshot?.active) {
      throw new NotFoundError('Jogo', input.gameId);
    }

    const supportsMode = await this.gameCatalog.supportsMode(input.gameId, input.mode);
    if (!supportsMode) {
      throw new ForbiddenError('Modo de jogo não suportado para este título');
    }

    const sala = Sala.create(input);
    await this.salaRepo.save(sala);
    await this.eventBus.publishAll(sala.pullDomainEvents());

    return {
      roomId: sala.id.toString(),
      gameId: sala.gameId,
      title: sala.title.toString(),
      mode: sala.mode.toString(),
      status: sala.status,
    };
  }
}
