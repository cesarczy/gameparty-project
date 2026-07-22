import type { DomainEvent } from '@shared/domain/domain-event.js';
import type { JogoId } from '../value-objects/jogo-id.vo.js';

export class JogoCadastradoEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'JogoCadastrado';

  constructor(
    readonly aggregateId: string,
    readonly payload: { slug: string; name: string },
  ) {}

  static create(jogoId: JogoId, slug: string, name: string): JogoCadastradoEvent {
    return new JogoCadastradoEvent(jogoId.toString(), { slug, name });
  }
}
