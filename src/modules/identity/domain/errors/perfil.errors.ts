import { DomainError } from '@shared/domain/domain.error.js';

export class SenhaAtualInvalidaError extends DomainError {
  constructor() {
    super('Senha atual incorreta');
    this.name = 'SenhaAtualInvalidaError';
  }
}

export class AvatarUrlInvalidaError extends DomainError {
  constructor() {
    super('URL da foto de perfil inválida');
    this.name = 'AvatarUrlInvalidaError';
  }
}

export class DisplayNameCooldownError extends DomainError {
  constructor(nextChangeAt: Date) {
    super(
      `Você só pode alterar o nick após ${nextChangeAt.toLocaleDateString('pt-BR')}`,
    );
    this.name = 'DisplayNameCooldownError';
  }
}

export class EmailCooldownError extends DomainError {
  constructor(nextChangeAt: Date) {
    super(
      `Você só pode alterar o e-mail após ${nextChangeAt.toLocaleDateString('pt-BR')}`,
    );
    this.name = 'EmailCooldownError';
  }
}

export class AvatarArquivoInvalidoError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'AvatarArquivoInvalidoError';
  }
}
