import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { NotFoundError } from '@shared/application/application.error.js';
import { SalaId } from '../../domain/value-objects/sala-id.vo.js';
import type { SalaRepository } from '../ports/sala.repository.js';

export interface SairDaSalaInput {
  roomId: string;
  playerId: string;
}

export interface SairDaSalaOutput {
  roomId: string;
  status: string;
  participantCount: number;
}

export class SairDaSalaUseCase {
  constructor(
    private readonly salaRepo: SalaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: SairDaSalaInput): Promise<SairDaSalaOutput> {
    const sala = await this.findSala(input.roomId);
    sala.sair(input.playerId);
    await this.salaRepo.save(sala);
    await this.eventBus.publishAll(sala.pullDomainEvents());

    return {
      roomId: sala.id.toString(),
      status: sala.status,
      participantCount: sala.participantes.length,
    };
  }

  private async findSala(roomId: string) {
    const sala = await this.salaRepo.findById(SalaId.create(roomId));
    if (!sala) {
      throw new NotFoundError('Sala', roomId);
    }
    return sala;
  }
}
