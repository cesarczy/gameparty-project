import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { NotFoundError } from '@shared/application/application.error.js';
import { RoomStatus } from '../../domain/value-objects/room-status.vo.js';
import type { SalaRepository } from '../ports/sala.repository.js';

export interface ListarSalasAtivasInput {
  gameId?: string;
  categoryId?: string;
}

export interface ListarSalasAtivasOutput {
  rooms: Array<{
    roomId: string;
    gameId: string;
    creatorId: string;
    title: string;
    mode: string;
    status: string;
    participantCount: number;
    capacity: number;
  }>;
}

export class ListarSalasAtivasUseCase {
  constructor(private readonly salaRepo: SalaRepository) {}

  async execute(input: ListarSalasAtivasInput): Promise<ListarSalasAtivasOutput> {
    let salas;
    if (input.gameId) {
      salas = await this.salaRepo.listActiveByGame(input.gameId);
    } else if (input.categoryId) {
      salas = await this.salaRepo.listActiveByCategory(input.categoryId);
    } else {
      salas = [];
    }

    const active = salas.filter(
      (s) => s.status === RoomStatus.ABERTA || s.status === RoomStatus.CHEIA,
    );

    return {
      rooms: active.map((s) => ({
        roomId: s.id.toString(),
        gameId: s.gameId,
        creatorId: s.creatorId,
        title: s.title.toString(),
        mode: s.mode.toString(),
        status: s.status,
        participantCount: s.participantes.length,
        capacity: s.capacity.toNumber(),
      })),
    };
  }
}
