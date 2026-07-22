import { DomainError } from '@shared/domain/domain.error.js';

const MIN_PASSWORD_LENGTH = 8;

export class SenhaHash {
  private constructor(private readonly value: string) {}

  static fromHash(hash: string): SenhaHash {
    if (!hash.trim()) {
      throw new DomainError('Hash de senha não pode ser vazio');
    }
    return new SenhaHash(hash);
  }

  static fromPlaintext(plaintext: string): SenhaHash {
    if (plaintext.length < MIN_PASSWORD_LENGTH) {
      throw new DomainError(
        `Senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }
    // Hash real será aplicado na infraestrutura; domínio valida requisito mínimo
    return new SenhaHash(`pending-hash:${plaintext}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: SenhaHash): boolean {
    return this.value === other.value;
  }
}
