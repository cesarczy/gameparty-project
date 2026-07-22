import type { Jogador } from '@identity/domain/jogador/jogador.aggregate.js';
import type { DisplayName } from '@identity/domain/value-objects/display-name.vo.js';
import type { Username } from '@identity/domain/value-objects/username.vo.js';
import type { Email } from '@identity/domain/value-objects/email.vo.js';
import type { JogadorId } from '@identity/domain/value-objects/jogador-id.vo.js';
import type { JogadorRepository } from '@identity/application/ports/jogador.repository.js';
import type { PasswordHasher } from '@identity/application/ports/password-hasher.port.js';
import type { GameCatalogReader, GameSnapshot } from '@catalog/application/ports/game-catalog.reader.js';

export class InMemoryJogadorRepository implements JogadorRepository {
  private readonly store = new Map<string, Jogador>();

  async save(jogador: Jogador): Promise<void> {
    this.store.set(jogador.id.toString(), jogador);
  }

  async findById(id: JogadorId): Promise<Jogador | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async findByEmail(email: Email): Promise<Jogador | null> {
    for (const jogador of this.store.values()) {
      if (jogador.email.equals(email)) {
        return jogador;
      }
    }
    return null;
  }

  async findByUsername(username: Username): Promise<Jogador | null> {
    for (const jogador of this.store.values()) {
      if (jogador.username.equals(username)) {
        return jogador;
      }
    }
    return null;
  }

  async findByDisplayName(displayName: DisplayName, excludeId?: JogadorId): Promise<Jogador | null> {
    for (const jogador of this.store.values()) {
      if (excludeId && jogador.id.equals(excludeId)) continue;
      if (jogador.displayName.sameAs(displayName)) {
        return jogador;
      }
    }
    return null;
  }

  async findByEmailVerificationToken(token: string): Promise<Jogador | null> {
    for (const jogador of this.store.values()) {
      if (jogador.emailVerificationToken === token) {
        return jogador;
      }
    }
    return null;
  }

  async findByPasswordResetToken(token: string): Promise<Jogador | null> {
    for (const jogador of this.store.values()) {
      if (jogador.passwordResetToken === token) {
        return jogador;
      }
    }
    return null;
  }

  async findByGoogleId(googleId: string): Promise<Jogador | null> {
    for (const jogador of this.store.values()) {
      if (jogador.googleId === googleId) {
        return jogador;
      }
    }
    return null;
  }

  async listAll(): Promise<Jogador[]> {
    return [...this.store.values()];
  }

  async search(query: string, limit = 8): Promise<Jogador[]> {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    return [...this.store.values()]
      .filter((jogador) => {
        const username = jogador.username.toString().toLowerCase();
        const displayName = jogador.displayName.toString().toLowerCase();
        const email = jogador.email.toString().toLowerCase();
        return username.includes(q) || displayName.includes(q) || email.includes(q);
      })
      .slice(0, limit);
  }

  async delete(id: JogadorId): Promise<void> {
    this.store.delete(id.toString());
  }
}

export class FakePasswordHasher implements PasswordHasher {
  async hash(plaintext: string): Promise<string> {
    return `hashed:${plaintext}`;
  }

  async compare(plaintext: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plaintext}`;
  }
}

export class InMemoryGameCatalogReader implements GameCatalogReader {
  constructor(private readonly games: GameSnapshot[] = []) {}

  async exists(gameId: string): Promise<boolean> {
    return this.games.some((g) => g.id === gameId && g.active);
  }

  async getSnapshot(gameId: string): Promise<GameSnapshot | null> {
    return this.games.find((g) => g.id === gameId) ?? null;
  }

  async supportsMode(gameId: string, mode: string): Promise<boolean> {
    const game = this.games.find((g) => g.id === gameId);
    return game?.supportedModes.includes(mode) ?? false;
  }
}

export { InMemoryEventBus } from '@shared/application/ports/in-memory-event-bus.adapter.js';
