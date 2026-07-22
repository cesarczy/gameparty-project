import { DomainError } from '@shared/domain/domain.error.js';

const MIN_LENGTH = 2;
const MAX_LENGTH = 32;

export class DisplayName {
  private constructor(private readonly value: string) {}

  static create(raw: string): DisplayName {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_LENGTH || trimmed.length > MAX_LENGTH) {
      throw new DomainError(
        `Nome de exibição deve ter entre ${MIN_LENGTH} e ${MAX_LENGTH} caracteres`,
      );
    }
    return new DisplayName(trimmed);
  }

  /** Chave normalizada para verificação de unicidade (case-insensitive). */
  static normalizeKey(raw: string): string {
    return raw.trim().toLowerCase();
  }

  sameAs(other: DisplayName): boolean {
    return DisplayName.normalizeKey(this.value) === DisplayName.normalizeKey(other.value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: DisplayName): boolean {
    return this.value === other.value;
  }
}
