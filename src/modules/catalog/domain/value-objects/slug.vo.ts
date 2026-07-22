import { DomainError } from '@shared/domain/domain.error.js';

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class Slug {
  private constructor(private readonly value: string) {}

  static create(raw: string): Slug {
    const normalized = raw.trim().toLowerCase();
    if (!SLUG_REGEX.test(normalized)) {
      throw new DomainError(
        'Slug inválido: use letras minúsculas, números e hífens',
      );
    }
    return new Slug(normalized);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }
}
