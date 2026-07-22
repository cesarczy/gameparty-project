import type { Jogador } from '../../domain/jogador/jogador.aggregate.js';
import type { DisplayName } from '../../domain/value-objects/display-name.vo.js';
import type { Email } from '../../domain/value-objects/email.vo.js';
import type { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { Username } from '../../domain/value-objects/username.vo.js';

export interface JogadorRepository {
  save(jogador: Jogador): Promise<void>;
  findById(id: JogadorId): Promise<Jogador | null>;
  findByEmail(email: Email): Promise<Jogador | null>;
  findByUsername(username: Username): Promise<Jogador | null>;
  findByDisplayName(displayName: DisplayName, excludeId?: JogadorId): Promise<Jogador | null>;
  search(query: string, limit?: number): Promise<Jogador[]>;
  delete(id: JogadorId): Promise<void>;
  findByGoogleId(googleId: string): Promise<Jogador | null>;
  findByEmailVerificationToken(token: string): Promise<Jogador | null>;
  findByPasswordResetToken(token: string): Promise<Jogador | null>;
  listAll(): Promise<Jogador[]>;
}
