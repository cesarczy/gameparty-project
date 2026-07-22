import type { DomainEvent } from '@shared/domain/domain-event.js';
import type { JogadorId } from '../value-objects/jogador-id.vo.js';

export class JogadorRegistradoEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'JogadorRegistrado';

  constructor(
    readonly aggregateId: string,
    readonly payload: { displayName: string },
  ) {}

  static create(jogadorId: JogadorId, displayName: string): JogadorRegistradoEvent {
    return new JogadorRegistradoEvent(jogadorId.toString(), { displayName });
  }
}
