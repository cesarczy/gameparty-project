import { UniqueId } from '@shared/domain/unique-id.vo.js';

export class CategoriaId {
  private constructor(private readonly value: UniqueId) {}

  static create(raw?: string): CategoriaId {
    return new CategoriaId(UniqueId.create(raw));
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: CategoriaId): boolean {
    return this.value.equals(other.value);
  }
}
