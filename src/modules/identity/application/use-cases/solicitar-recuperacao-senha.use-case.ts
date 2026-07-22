import { randomBytes } from 'node:crypto';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import type { EmailSender } from '../ports/email-sender.port.js';
import { Email } from '../../domain/value-objects/email.vo.js';

const RESET_MESSAGE =
  'Se o e-mail estiver cadastrado, enviaremos instruções para redefinir sua senha.';

export class SolicitarRecuperacaoSenhaUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly emailSender: EmailSender,
    private readonly appPublicUrl: string,
  ) {}

  async execute(input: { email: string }): Promise<{ message: string }> {
    const email = Email.create(input.email);
    const jogador = await this.jogadorRepo.findByEmail(email);

    if (jogador && jogador.senhaHash) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      jogador.solicitarRecuperacaoSenha(token, expiresAt);
      await this.jogadorRepo.save(jogador);

      const resetLink = `${this.appPublicUrl.replace(/\/$/, '')}/redefinir-senha?token=${token}`;
      await this.emailSender.sendPasswordResetEmail({
        to: jogador.email.toString(),
        userName: jogador.fullName.toString(),
        resetLink,
      });
    }

    return { message: RESET_MESSAGE };
  }
}
