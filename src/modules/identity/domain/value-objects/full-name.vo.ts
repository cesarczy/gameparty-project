import { ApplicationError } from '@shared/application/application.error.js';

export class FullName {
  private constructor(private readonly value: string) {}

  static create(raw: string): FullName {
    const normalized = raw.trim().replace(/\s+/g, ' ');
    if (normalized.length < 2) {
      throw new ApplicationError('Informe seu nome completo.');
    }
    if (normalized.length > 120) {
      throw new ApplicationError('Nome completo deve ter no máximo 120 caracteres.');
    }
    return new FullName(normalized);
  }

  toString(): string {
    return this.value;
  }
}
