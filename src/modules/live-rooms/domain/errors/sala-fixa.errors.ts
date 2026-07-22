import { DomainError } from '@shared/domain/domain.error.js';

export class ContaGoogleSemSenhaError extends DomainError {
  constructor() {
    super('Esta conta usa login com Google');
    this.name = 'ContaGoogleSemSenhaError';
  }
}

export class SalaFixaNaoEncerravelError extends DomainError {
  constructor() {
    super('Salas fixas não podem ser encerradas');
    this.name = 'SalaFixaNaoEncerravelError';
  }
}
