import { randomUUID } from 'node:crypto';
import { DomainError } from './domain.error.js';

export class UniqueId {
  private constructor(private readonly value: string) {}

  static create(raw?: string): UniqueId {
    const id = raw ?? randomUUID();
    if (!id.trim()) {
      throw new DomainError('Id cannot be empty');
    }
    return new UniqueId(id);
  }

  toString(): string {
    return this.value;
  }

  equals(other: UniqueId): boolean {
    return this.value === other.value;
  }
}
