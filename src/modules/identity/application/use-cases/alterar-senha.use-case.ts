import { NotFoundError } from '@shared/application/application.error.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { SenhaHash } from '../../domain/value-objects/senha-hash.vo.js';
import { SenhaAtualInvalidaError } from '../../domain/errors/perfil.errors.js';

export interface AlterarSenhaInput {
  playerId: string;
  senhaAtual?: string;
  senhaNova: string;
}

export interface AlterarSenhaOutput {
  playerId: string;
  updated: true;
}

export class AlterarSenhaUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: AlterarSenhaInput): Promise<AlterarSenhaOutput> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.playerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', input.playerId);
    }

    if (jogador.exigeSenhaLocal()) {
      if (!input.senhaAtual) {
        throw new SenhaAtualInvalidaError();
      }
      const valid = await this.passwordHasher.compare(
        input.senhaAtual,
        jogador.senhaHash!.toString(),
      );
      if (!valid) {
        throw new SenhaAtualInvalidaError();
      }
    }

    const hash = await this.passwordHasher.hash(input.senhaNova);
    jogador.definirSenhaHash(SenhaHash.fromHash(hash));
    await this.jogadorRepo.save(jogador);

    return { playerId: jogador.id.toString(), updated: true };
  }
}
