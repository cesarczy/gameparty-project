import type { DomainEvent } from '@shared/domain/domain-event.js';
import type { EventBus } from '@shared/application/ports/event-bus.port.js';

export class LoggingEventBus implements EventBus {
  constructor(private readonly inner: EventBus) {}

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      console.log(JSON.stringify({
        type: 'domain_event',
        name: event.eventName,
        aggregateId: event.aggregateId,
        occurredAt: event.occurredAt.toISOString(),
      }));
    }
    await this.inner.publishAll(events);
  }
}
