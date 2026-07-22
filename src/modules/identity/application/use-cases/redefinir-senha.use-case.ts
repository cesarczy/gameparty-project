import { ApplicationError } from '@shared/application/application.error.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import { SenhaHash } from '../../domain/value-objects/senha-hash.vo.js';

export class RedefinirSenhaUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: { token: string; senha: string }): Promise<{ message: string }> {
    const jogador = await this.jogadorRepo.findByPasswordResetToken(input.token);
    if (!jogador) {
      throw new ApplicationError('Link de recuperação inválido ou expirado.');
    }

    const hash = await this.passwordHasher.hash(input.senha);
    jogador.concluirRecuperacaoSenha(input.token, SenhaHash.fromHash(hash));
    await this.jogadorRepo.save(jogador);

    return { message: 'Senha redefinida com sucesso. Você já pode entrar.' };
  }
}
