import { UniqueId } from '@shared/domain/unique-id.vo.js';

export class MensagemId {
  private constructor(private readonly value: UniqueId) {}

  static create(raw?: string): MensagemId {
    return new MensagemId(UniqueId.create(raw));
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: MensagemId): boolean {
    return this.value.equals(other.value);
  }
}
