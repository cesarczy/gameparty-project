import { ApplicationError, NotFoundError } from '@shared/application/application.error.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';

export class VerificarEmailUseCase {
  constructor(private readonly jogadorRepo: JogadorRepository) {}

  async execute(input: { token: string }) {
    const jogador = await this.jogadorRepo.findByEmailVerificationToken(input.token);
    if (!jogador) {
      throw new NotFoundError('Token de verificação', input.token);
    }
    if (jogador.emailVerified) {
      return {
        verified: true,
        alreadyVerified: true,
        playerId: jogador.id.toString(),
        displayName: jogador.displayName.toString(),
      };
    }
    jogador.confirmarEmail();
    await this.jogadorRepo.save(jogador);
    return {
      verified: true,
      alreadyVerified: false,
      playerId: jogador.id.toString(),
      displayName: jogador.displayName.toString(),
    };
  }
}
