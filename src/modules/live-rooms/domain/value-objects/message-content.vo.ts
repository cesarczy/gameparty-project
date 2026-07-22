import { DomainError } from '@shared/domain/domain.error.js';

const MAX_LENGTH = 2000;

export class MessageContent {
  private constructor(private readonly value: string) {}

  static create(raw: string): MessageContent {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new DomainError('Mensagem não pode ser vazia');
    }
    if (trimmed.length > MAX_LENGTH) {
      throw new DomainError(`Mensagem excede ${MAX_LENGTH} caracteres`);
    }
    return new MessageContent(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: MessageContent): boolean {
    return this.value === other.value;
  }
}
