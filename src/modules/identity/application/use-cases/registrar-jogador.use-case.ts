import type { JogadorRepository } from '../ports/jogador.repository.js';
import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { ConflictError } from '@shared/application/application.error.js';
import { Jogador } from '../../domain/jogador/jogador.aggregate.js';
import { DisplayName } from '../../domain/value-objects/display-name.vo.js';
import { FullName } from '../../domain/value-objects/full-name.vo.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { SenhaHash } from '../../domain/value-objects/senha-hash.vo.js';
import { Username } from '../../domain/value-objects/username.vo.js';
import type { PasswordHasher } from '../ports/password-hasher.port.js';
import { randomBytes } from 'node:crypto';

export interface RegistrarJogadorInput {
  username: string;
  email: string;
  senha: string;
  fullName: string;
  displayName: string;
  birthDate: string;
  country: string;
  language: string;
  acceptTerms: true;
  confirmAge18: true;
}

export interface RegistrarJogadorOutput {
  playerId: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  emailVerificationRequired: boolean;
  verificationMessage: string;
}

export class RegistrarJogadorUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: RegistrarJogadorInput): Promise<RegistrarJogadorOutput> {
    const username = Username.create(input.username);
    const email = Email.create(input.email);

    if (await this.jogadorRepo.findByEmail(email)) {
      throw new ConflictError('E-mail já cadastrado');
    }
    if (await this.jogadorRepo.findByUsername(username)) {
      throw new ConflictError('Nome de usuário já está em uso');
    }
    const displayName = DisplayName.create(input.displayName.trim());
    const fullName = FullName.create(input.fullName);
    if (await this.jogadorRepo.findByDisplayName(displayName)) {
      throw new ConflictError('Nome de exibição já está em uso');
    }

    const hash = await this.passwordHasher.hash(input.senha);
    const verificationToken = randomBytes(32).toString('hex');

    const jogador = Jogador.register({
      username,
      email: input.email,
      fullName,
      displayName,
      senhaHash: SenhaHash.fromHash(hash),
      birthDate: new Date(input.birthDate),
      country: input.country,
      language: input.language,
      termsAcceptedAt: new Date(),
      emailVerificationToken: verificationToken,
    });

    await this.jogadorRepo.save(jogador);
    await this.eventBus.publishAll(jogador.pullDomainEvents());

    console.info(
      `[GameParty] Verificação de e-mail para ${input.email}: /verificar-email?token=${verificationToken}`,
    );

    return {
      playerId: jogador.id.toString(),
      username: jogador.username.toString(),
      displayName: jogador.displayName.toString(),
      role: jogador.role,
      avatarUrl: jogador.avatarUrl,
      emailVerificationRequired: true,
      verificationMessage: 'Enviamos um link de confirmação para seu e-mail. Verifique sua caixa de entrada.',
    };
  }
}
