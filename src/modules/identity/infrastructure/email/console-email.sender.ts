import type { EmailSender, PasswordResetEmailInput } from '../../application/ports/email-sender.port.js';

function buildPasswordResetHtml(input: PasswordResetEmailInput): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
  <p>Olá, ${input.userName}!</p>
  <p>Recebemos uma solicitação para redefinir a senha da sua conta no GameParty.</p>
  <p>Se foi você quem fez essa solicitação, clique no botão abaixo para criar uma nova senha:</p>
  <p><a href="${input.resetLink}" style="display:inline-block;padding:12px 20px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;">Redefinir Senha</a></p>
  <p>Ou copie e cole este link no seu navegador:</p>
  <p><a href="${input.resetLink}">${input.resetLink}</a></p>
  <p>Por motivos de segurança, este link é válido por 30 minutos e pode ser utilizado apenas uma vez.</p>
  <p>Se você não solicitou a redefinição da senha, pode ignorar este e-mail. Sua conta permanecerá segura e nenhuma alteração será realizada.</p>
  <p>Atenciosamente,<br/>Equipe GameParty</p>
</body>
</html>`;
}

export class ConsoleEmailSender implements EmailSender {
  async sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<void> {
    const html = buildPasswordResetHtml(input);
    console.info(`[GameParty] E-mail de recuperação de senha para ${input.to}`);
    console.info(`[GameParty] Link: ${input.resetLink}`);
    console.info(`[GameParty] HTML:\n${html}`);
  }
}

export { buildPasswordResetHtml };
