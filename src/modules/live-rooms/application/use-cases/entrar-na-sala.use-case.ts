import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { NotFoundError, UnauthorizedError } from '@shared/application/application.error.js';
import type { JogadorRepository } from '@identity/application/ports/jogador.repository.js';
import { JogadorId } from '@identity/domain/value-objects/jogador-id.vo.js';
import { SalaId } from '../../domain/value-objects/sala-id.vo.js';
import type { SalaRepository } from '../ports/sala.repository.js';

export interface EntrarNaSalaInput {
  roomId: string;
  playerId: string;
}

export interface EntrarNaSalaOutput {
  roomId: string;
  status: string;
  participantCount: number;
}

export class EntrarNaSalaUseCase {
  constructor(
    private readonly salaRepo: SalaRepository,
    private readonly jogadorRepo: JogadorRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: EntrarNaSalaInput): Promise<EntrarNaSalaOutput> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new UnauthorizedError('Sessão inválida. Faça login novamente.');
    }

    const sala = await this.findSala(input.roomId);
    const jaParticipava = sala.temParticipante(input.playerId);

    if (!jaParticipava) {
      sala.entrar(input.playerId);
      await this.eventBus.publishAll(sala.pullDomainEvents());
    }

    jogador.registrarAtividade();
    await this.jogadorRepo.save(jogador);
    await this.salaRepo.registrarParticipante(sala.id.toString(), input.playerId);

    const participantCount = await this.salaRepo.contarParticipantes(sala.id.toString());

    return {
      roomId: sala.id.toString(),
      status: sala.status,
      participantCount,
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
