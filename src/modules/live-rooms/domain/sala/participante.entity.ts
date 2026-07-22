import { DomainError } from '@shared/domain/domain.error.js';

export class Participante {
  private constructor(
    readonly jogadorId: string,
    readonly joinedAt: Date,
  ) {}

  static create(jogadorId: string): Participante {
    if (!jogadorId.trim()) {
      throw new DomainError('Id do jogador é obrigatório');
    }
    return new Participante(jogadorId, new Date());
  }

  static reconstitute(jogadorId: string, joinedAt: Date): Participante {
    return new Participante(jogadorId, joinedAt);
  }
}
