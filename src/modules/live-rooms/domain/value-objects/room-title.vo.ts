import { DomainError } from '@shared/domain/domain.error.js';

const MIN_LENGTH = 3;
const MAX_LENGTH = 80;

export class RoomTitle {
  private constructor(private readonly value: string) {}

  static create(raw: string): RoomTitle {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new DomainError(
        `Título da sala deve ter entre ${MIN_LENGTH} e ${MAX_LENGTH} caracteres`,
      );
    }
    return new RoomTitle(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: RoomTitle): boolean {
    return this.value === other.value;
  }
}
