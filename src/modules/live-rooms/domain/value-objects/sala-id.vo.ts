import { UniqueId } from '@shared/domain/unique-id.vo.js';

export class SalaId {
  private constructor(private readonly value: UniqueId) {}

  static create(raw?: string): SalaId {
    return new SalaId(UniqueId.create(raw));
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: SalaId): boolean {
    return this.value.equals(other.value);
  }
}
