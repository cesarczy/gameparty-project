import { DomainError } from '@shared/domain/domain.error.js';

export class FavoritoJaExisteError extends DomainError {
  constructor(gameId: string) {
    super(`Jogo ${gameId} já está nos favoritos`);
    this.name = 'FavoritoJaExisteError';
  }
}

export class FavoritoNaoEncontradoError extends DomainError {
  constructor(gameId: string) {
    super(`Jogo ${gameId} não está nos favoritos`);
    this.name = 'FavoritoNaoEncontradoError';
  }
}
