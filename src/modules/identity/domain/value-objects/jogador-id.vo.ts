import { UniqueId } from '@shared/domain/unique-id.vo.js';

export class JogadorId {
  private constructor(private readonly value: UniqueId) {}

  static create(raw?: string): JogadorId {
    return new JogadorId(UniqueId.create(raw));
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: JogadorId): boolean {
    return this.value.equals(other.value);
  }
}
