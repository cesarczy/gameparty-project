import { DomainError } from '@shared/domain/domain.error.js';
import { GameMode } from '../value-objects/game-mode.vo.js';

export class JogoSemModoError extends DomainError {
  constructor() {
    super('Jogo deve suportar ao menos um modo de jogo');
    this.name = 'JogoSemModoError';
  }
}

export class ModoDeJogoInvalidoError extends DomainError {
  constructor(mode: string) {
    super(`Modo de jogo inválido: ${mode}`);
    this.name = 'ModoDeJogoInvalidoError';
  }
}

export function assertValidGameModes(modes: GameMode[]): void {
  if (modes.length === 0) {
    throw new JogoSemModoError();
  }
  const valid = new Set<string>(Object.values(GameMode));
  for (const mode of modes) {
    if (!valid.has(mode)) {
      throw new ModoDeJogoInvalidoError(String(mode));
    }
  }
}
