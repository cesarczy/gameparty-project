import type { DomainEvent } from '@shared/domain/domain-event.js';
import type { EventBus } from './event-bus.port.js';

export class InMemoryEventBus implements EventBus {
  readonly published: DomainEvent[] = [];

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.published.push(...events);
  }
}
