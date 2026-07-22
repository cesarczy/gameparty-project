import { ApplicationError } from '@shared/application/application.error.js';

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

export class Username {
  private constructor(private readonly value: string) {}

  static create(raw: string): Username {
    const normalized = raw.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalized)) {
      throw new ApplicationError(
        'Nome de usuário inválido. Use 3–20 caracteres: letras minúsculas, números ou _',
      );
    }
    return new Username(normalized);
  }

  static normalize(raw: string): string {
    return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
