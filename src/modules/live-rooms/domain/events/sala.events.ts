import type { DomainEvent } from '@shared/domain/domain-event.js';
import type { SalaId } from '../value-objects/sala-id.vo.js';

export class SalaCriadaEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'SalaCriada';

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      gameId: string;
      creatorId: string;
      title: string;
      mode: string;
    },
  ) {}

  static create(
    salaId: SalaId,
    payload: { gameId: string; creatorId: string; title: string; mode: string },
  ): SalaCriadaEvent {
    return new SalaCriadaEvent(salaId.toString(), payload);
  }
}

export class JogadorEntrouNaSalaEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'JogadorEntrouNaSala';

  constructor(
    readonly aggregateId: string,
    readonly payload: { jogadorId: string },
  ) {}

  static create(salaId: SalaId, jogadorId: string): JogadorEntrouNaSalaEvent {
    return new JogadorEntrouNaSalaEvent(salaId.toString(), { jogadorId });
  }
}

export class JogadorSaiuDaSalaEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'JogadorSaiuDaSala';

  constructor(
    readonly aggregateId: string,
    readonly payload: { jogadorId: string },
  ) {}

  static create(salaId: SalaId, jogadorId: string): JogadorSaiuDaSalaEvent {
    return new JogadorSaiuDaSalaEvent(salaId.toString(), { jogadorId });
  }
}

export class SalaEncerradaEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'SalaEncerrada';

  constructor(readonly aggregateId: string) {}

  static create(salaId: SalaId): SalaEncerradaEvent {
    return new SalaEncerradaEvent(salaId.toString());
  }
}
