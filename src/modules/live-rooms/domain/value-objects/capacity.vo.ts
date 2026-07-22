import { DomainError } from '@shared/domain/domain.error.js';

const MIN_CAPACITY = 2;
const MAX_CAPACITY = 1000;

export class Capacity {
  private constructor(private readonly value: number) {}

  static create(raw: number): Capacity {
    if (!Number.isInteger(raw) || raw < MIN_CAPACITY || raw > MAX_CAPACITY) {
      throw new DomainError(
        `Capacidade deve ser inteiro entre ${MIN_CAPACITY} e ${MAX_CAPACITY}`,
      );
    }
    return new Capacity(raw);
  }

  toNumber(): number {
    return this.value;
  }

  equals(other: Capacity): boolean {
    return this.value === other.value;
  }
}
