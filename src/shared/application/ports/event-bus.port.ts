import type { DomainEvent } from '../domain/domain-event.js';

export interface EventBus {
  publishAll(events: DomainEvent[]): Promise<void>;
}
