import type { EventBus } from '@shared/application/ports/event-bus.port.js';
import { ForbiddenError } from '@shared/application/application.error.js';
import type { GoogleTokenVerifier } from '../ports/google-token-verifier.port.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { Email } from '../../domain/value-objects/email.vo.js';
import { Jogador } from '../../domain/jogador/jogador.aggregate.js';
import { resolveUniqueUsername } from '../services/resolve-unique-username.js';
import { resolveUniqueDisplayName } from '../services/resolve-unique-display-name.js';

export interface AutenticarGoogleInput {
  idToken: string;
}

export interface AutenticarGoogleOutput {
  playerId: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
}

export class AutenticarGoogleUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly googleVerifier: GoogleTokenVerifier,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: AutenticarGoogleInput): Promise<AutenticarGoogleOutput> {
    const profile = await this.googleVerifier.verify(input.idToken);

    let jogador = await this.jogadorRepo.findByGoogleId(profile.googleId);

    if (!jogador) {
      const byEmail = await this.jogadorRepo.findByEmail(Email.create(profile.email));
      if (byEmail) {
        byEmail.vincularGoogle(profile.googleId, profile.avatarUrl);
        jogador = byEmail;
      } else {
        const username = await resolveUniqueUsername(
          this.jogadorRepo,
          profile.email.split('@')[0] ?? profile.displayName,
        );
        const displayName = await resolveUniqueDisplayName(
          this.jogadorRepo,
          profile.displayName,
        );
        jogador = Jogador.fromGoogle({
          username,
          email: profile.email,
          displayName,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
        });
      }
    }

    if (jogador.estaBanido()) {
      throw new ForbiddenError('Conta banida');
    }

    jogador.registrarAtividade();
    await this.jogadorRepo.save(jogador);
    await this.eventBus.publishAll(jogador.pullDomainEvents());

    return {
      playerId: jogador.id.toString(),
      displayName: jogador.displayName.toString(),
      role: jogador.role,
      avatarUrl: jogador.avatarUrl,
    };
  }
}
