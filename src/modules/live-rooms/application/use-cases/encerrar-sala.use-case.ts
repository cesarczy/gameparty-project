import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { NotFoundError } from '@shared/application/application.error.js';
import { SalaId } from '../../domain/value-objects/sala-id.vo.js';
import type { SalaRepository } from '../ports/sala.repository.js';

export interface EncerrarSalaInput {
  roomId: string;
  requesterId: string;
}

export interface EncerrarSalaOutput {
  roomId: string;
  status: string;
}

export class EncerrarSalaUseCase {
  constructor(
    private readonly salaRepo: SalaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: EncerrarSalaInput): Promise<EncerrarSalaOutput> {
    const sala = await this.findSala(input.roomId);
    sala.encerrar(input.requesterId);
    await this.salaRepo.save(sala);
    await this.eventBus.publishAll(sala.pullDomainEvents());

    return {
      roomId: sala.id.toString(),
      status: sala.status,
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
