import { describe, expect, it } from 'vitest';
import { CriarSalaUseCase } from '../../src/modules/live-rooms/application/use-cases/criar-sala.use-case.js';
import { EnviarMensagemUseCase } from '../../src/modules/live-rooms/application/use-cases/enviar-mensagem.use-case.js';
import { EntrarNaSalaUseCase } from '../../src/modules/live-rooms/application/use-cases/entrar-na-sala.use-case.js';
import { ForbiddenError } from '../../src/shared/application/application.error.js';
import type { SalaRepository } from '../../src/modules/live-rooms/application/ports/sala.repository.js';
import type { MensagemRepository } from '../../src/modules/live-rooms/application/ports/sala.repository.js';
import type { Sala } from '../../src/modules/live-rooms/domain/sala/sala.aggregate.js';
import type { Mensagem } from '../../src/modules/live-rooms/domain/mensagem/mensagem.aggregate.js';
import type { SalaId } from '../../src/modules/live-rooms/domain/value-objects/sala-id.vo.js';
import {
  InMemoryEventBus,
  InMemoryGameCatalogReader,
  InMemoryJogadorRepository,
} from '../helpers/in-memory-adapters.js';
import { Jogador } from '../../src/modules/identity/domain/jogador/jogador.aggregate.js';

class InMemorySalaRepository implements SalaRepository {
  private readonly store = new Map<string, Sala>();

  async save(sala: Sala): Promise<void> {
    this.store.set(sala.id.toString(), sala);
  }

  async findById(id: SalaId): Promise<Sala | null> {
    return this.store.get(id.toString()) ?? null;
  }

  async listActiveByGame(gameId: string): Promise<Sala[]> {
    return [...this.store.values()].filter((s) => s.gameId === gameId);
  }

  async listActiveByCategory(_categoryId: string): Promise<Sala[]> {
    return [];
  }

  async registrarParticipante(salaId: string, jogadorId: string): Promise<void> {
    const sala = this.store.get(salaId);
    if (!sala) return;
    if (!sala.temParticipante(jogadorId)) {
      sala.entrar(jogadorId);
    }
    this.store.set(salaId, sala);
  }

  async contarParticipantes(salaId: string): Promise<number> {
    const sala = this.store.get(salaId);
    return sala?.participantes.length ?? 0;
  }
}

class InMemoryMensagemRepository implements MensagemRepository {
  readonly messages: Mensagem[] = [];

  async save(mensagem: Mensagem): Promise<void> {
    this.messages.push(mensagem);
  }

  async listRecentByRoom(_roomId: string) {
    return [];
  }

  async deleteSentBefore(_cutoff: Date): Promise<number> {
    return 0;
  }
}

describe('Live-rooms use cases', () => {
  const gameCatalog = new InMemoryGameCatalogReader([
    {
      id: 'game-1',
      name: 'Valorant',
      slug: 'valorant',
      active: true,
      supportedModes: ['ONLINE', 'CAMPANHA'],
    },
  ]);

  it('cria sala e envia mensagem como participante', async () => {
    const salaRepo = new InMemorySalaRepository();
    const mensagemRepo = new InMemoryMensagemRepository();
    const eventBus = new InMemoryEventBus();
    const jogadorRepo = new InMemoryJogadorRepository();

    const creator = Jogador.create({
      username: 'creator',
      email: 'creator@test.com',
      displayName: 'Creator',
      senha: 'password123',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });
    await jogadorRepo.save(creator);
    const creatorId = creator.id.toString();

    const criar = new CriarSalaUseCase(salaRepo, gameCatalog, eventBus);
    const sala = await criar.execute({
      gameId: 'game-1',
      creatorId,
      title: 'LFG ranked',
      mode: 'ONLINE',
      capacity: 5,
    });

    const enviar = new EnviarMensagemUseCase(salaRepo, mensagemRepo, jogadorRepo, eventBus);
    const msg = await enviar.execute({
      roomId: sala.roomId,
      authorId: creatorId,
      content: 'Alguém online?',
    });

    expect(msg.content).toBe('Alguém online?');
    expect(msg.authorDisplayName).toBe('Creator');
    expect(mensagemRepo.messages).toHaveLength(1);
  });

  it('impede mensagem de não-participante', async () => {
    const salaRepo = new InMemorySalaRepository();
    const eventBus = new InMemoryEventBus();

    const criar = new CriarSalaUseCase(salaRepo, gameCatalog, eventBus);
    const sala = await criar.execute({
      gameId: 'game-1',
      creatorId: 'creator-1',
      title: 'LFG',
      mode: 'ONLINE',
      capacity: 5,
    });

    const enviar = new EnviarMensagemUseCase(
      salaRepo,
      new InMemoryMensagemRepository(),
      new InMemoryJogadorRepository(),
      eventBus,
    );

    await expect(
      enviar.execute({
        roomId: sala.roomId,
        authorId: 'outsider',
        content: 'Oi',
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it('permite entrar na sala', async () => {
    const salaRepo = new InMemorySalaRepository();
    const eventBus = new InMemoryEventBus();
    const jogadorRepo = new InMemoryJogadorRepository();
    const player2 = Jogador.create({
      username: 'player2',
      email: 'p2@test.com',
      displayName: 'Player2',
      senha: 'password123',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });
    await jogadorRepo.save(player2);

    const criar = new CriarSalaUseCase(salaRepo, gameCatalog, eventBus);
    const sala = await criar.execute({
      gameId: 'game-1',
      creatorId: 'creator-1',
      title: 'LFG',
      mode: 'ONLINE',
      capacity: 5,
    });

    const entrar = new EntrarNaSalaUseCase(salaRepo, jogadorRepo, eventBus);
    const result = await entrar.execute({
      roomId: sala.roomId,
      playerId: player2.id.toString(),
    });

    expect(result.participantCount).toBe(2);
  });

  it('permite reentrar na sala sem erro', async () => {
    const salaRepo = new InMemorySalaRepository();
    const eventBus = new InMemoryEventBus();
    const jogadorRepo = new InMemoryJogadorRepository();
    const player2 = Jogador.create({
      username: 'player2',
      email: 'p2@test.com',
      displayName: 'Player2',
      senha: 'password123',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });
    await jogadorRepo.save(player2);

    const criar = new CriarSalaUseCase(salaRepo, gameCatalog, eventBus);
    const sala = await criar.execute({
      gameId: 'game-1',
      creatorId: 'creator-1',
      title: 'LFG',
      mode: 'ONLINE',
      capacity: 5,
    });

    const entrar = new EntrarNaSalaUseCase(salaRepo, jogadorRepo, eventBus);
    const playerId = player2.id.toString();
    await entrar.execute({ roomId: sala.roomId, playerId });
    const again = await entrar.execute({ roomId: sala.roomId, playerId });

    expect(again.participantCount).toBe(2);
  });
});
