import type { DomainEvent } from '@shared/domain/domain-event.js';
import { DomainError } from '@shared/domain/domain.error.js';
import { MessageContent } from '../value-objects/message-content.vo.js';
import { MensagemId } from '../value-objects/mensagem-id.vo.js';

export class MensagemEnviadaEvent implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'MensagemEnviada';

  constructor(
    readonly aggregateId: string,
    readonly payload: {
      roomId: string;
      authorId: string;
      content: string;
    },
  ) {}

  static create(
    mensagemId: MensagemId,
    payload: { roomId: string; authorId: string; content: string },
  ): MensagemEnviadaEvent {
    return new MensagemEnviadaEvent(mensagemId.toString(), payload);
  }
}

export interface MensagemProps {
  id: MensagemId;
  roomId: string;
  authorId: string;
  content: MessageContent;
  sentAt: Date;
}

export class Mensagem {
  private readonly domainEvents: DomainEvent[] = [];

  private constructor(private props: MensagemProps) {}

  static create(input: {
    roomId: string;
    authorId: string;
    content: string;
  }): Mensagem {
    if (!input.roomId.trim() || !input.authorId.trim()) {
      throw new DomainError('Sala e autor são obrigatórios');
    }

    const mensagem = new Mensagem({
      id: MensagemId.create(),
      roomId: input.roomId,
      authorId: input.authorId,
      content: MessageContent.create(input.content),
      sentAt: new Date(),
    });

    mensagem.record(
      MensagemEnviadaEvent.create(mensagem.props.id, {
        roomId: mensagem.props.roomId,
        authorId: mensagem.props.authorId,
        content: mensagem.props.content.toString(),
      }),
    );

    return mensagem;
  }

  static reconstitute(props: MensagemProps): Mensagem {
    return new Mensagem(props);
  }

  get id(): MensagemId {
    return this.props.id;
  }

  get roomId(): string {
    return this.props.roomId;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get content(): MessageContent {
    return this.props.content;
  }

  get sentAt(): Date {
    return this.props.sentAt;
  }

  pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents.length = 0;
    return events;
  }

  private record(event: DomainEvent): void {
    this.domainEvents.push(event);
  }
}
