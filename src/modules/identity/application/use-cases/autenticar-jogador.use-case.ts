import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { UnauthorizedError, ForbiddenError } from '@shared/application/application.error.js';
import { ContaGoogleSemSenhaError } from '../../domain/errors/google-auth.errors.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';

export interface AutenticarJogadorInput {
  email: string;
  senha: string;
}

export interface AutenticarJogadorOutput {
  playerId: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}

export class AutenticarJogadorUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: AutenticarJogadorInput): Promise<AutenticarJogadorOutput> {
    const email = Email.create(input.email);
    const jogador = await this.jogadorRepo.findByEmail(email);
    if (!jogador) {
      throw new UnauthorizedError();
    }

    if (!jogador.senhaHash) {
      throw new ContaGoogleSemSenhaError();
    }

    const valid = await this.passwordHasher.compare(
      input.senha,
      jogador.senhaHash.toString(),
    );
    if (!valid) {
      throw new UnauthorizedError();
    }

    if (jogador.estaBanido()) {
      throw new ForbiddenError('Conta banida');
    }

    jogador.registrarAtividade();
    await this.jogadorRepo.save(jogador);

    return {
      playerId: jogador.id.toString(),
      displayName: jogador.displayName.toString(),
      role: jogador.role,
      avatarUrl: jogador.avatarUrl,
    };
  }
}
