import { OAuth2Client } from 'google-auth-library';
import type {
  GoogleProfile,
  GoogleTokenVerifier,
} from '../../application/ports/google-token-verifier.port.js';

export class GoogleAuthVerifier implements GoogleTokenVerifier {
  private readonly client: OAuth2Client;

  constructor(private readonly clientId: string) {
    this.client = new OAuth2Client(clientId);
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    const ticket = await this.client.verifyIdToken({
      idToken,
      audience: this.clientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new Error('Token Google inválido');
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      displayName: payload.name ?? payload.email.split('@')[0] ?? 'Jogador',
      avatarUrl: payload.picture ?? null,
    };
  }
}
