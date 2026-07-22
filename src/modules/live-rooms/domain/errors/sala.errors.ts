import { DomainError } from '@shared/domain/domain.error.js';

export class SalaEncerradaError extends DomainError {
  constructor() {
    super('Sala já foi encerrada');
    this.name = 'SalaEncerradaError';
  }
}

export class SalaCheiaError extends DomainError {
  constructor() {
    super('Sala atingiu capacidade máxima');
    this.name = 'SalaCheiaError';
  }
}

export class ParticipanteJaNaSalaError extends DomainError {
  constructor(jogadorId: string) {
    super(`Jogador ${jogadorId} já está na sala`);
    this.name = 'ParticipanteJaNaSalaError';
  }
}

export class ParticipanteNaoEncontradoError extends DomainError {
  constructor(jogadorId: string) {
    super(`Jogador ${jogadorId} não está na sala`);
    this.name = 'ParticipanteNaoEncontradoError';
  }
}

export class CriadorInvalidoError extends DomainError {
  constructor() {
    super('Apenas o criador pode encerrar a sala');
    this.name = 'CriadorInvalidoError';
  }
}
