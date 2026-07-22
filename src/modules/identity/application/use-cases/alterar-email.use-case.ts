import { ConflictError, NotFoundError } from '@shared/application/application.error.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { SenhaAtualInvalidaError } from '../../domain/errors/perfil.errors.js';

export interface AlterarEmailInput {
  playerId: string;
  novoEmail: string;
  senhaAtual?: string;
}

export interface AlterarEmailOutput {
  playerId: string;
  email: string;
}

export class AlterarEmailUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: AlterarEmailInput): Promise<AlterarEmailOutput> {
    const jogador = await this.findJogador(input.playerId);
    const novoEmail = Email.create(input.novoEmail);

    if (jogador.email.equals(novoEmail)) {
      return { playerId: jogador.id.toString(), email: jogador.email.toString() };
    }

    const existing = await this.jogadorRepo.findByEmail(novoEmail);
    if (existing && !existing.id.equals(jogador.id)) {
      throw new ConflictError('E-mail já cadastrado');
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

    jogador.atualizarEmail(input.novoEmail);
    await this.jogadorRepo.save(jogador);

    return { playerId: jogador.id.toString(), email: jogador.email.toString() };
  }

  private async findJogador(playerId: string) {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(playerId));
    if (!jogador) {
      throw new NotFoundError('Jogador', playerId);
    }
    return jogador;
  }
}
