import { UniqueId } from '@shared/domain/unique-id.vo.js';

export class JogoId {
  private constructor(private readonly value: UniqueId) {}

  static create(raw?: string): JogoId {
    return new JogoId(UniqueId.create(raw));
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: JogoId): boolean {
    return this.value.equals(other.value);
  }
}
