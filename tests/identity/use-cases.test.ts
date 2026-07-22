import { describe, expect, it } from 'vitest';
import { RegistrarJogadorUseCase } from '../../src/modules/identity/application/use-cases/registrar-jogador.use-case.js';
import { AutenticarJogadorUseCase } from '../../src/modules/identity/application/use-cases/autenticar-jogador.use-case.js';
import { AdicionarJogoFavoritoUseCase } from '../../src/modules/identity/application/use-cases/adicionar-jogo-favorito.use-case.js';
import { ConflictError, NotFoundError, UnauthorizedError } from '../../src/shared/application/application.error.js';
import {
  FakePasswordHasher,
  InMemoryEventBus,
  InMemoryGameCatalogReader,
  InMemoryJogadorRepository,
} from '../helpers/in-memory-adapters.js';

describe('Identity use cases', () => {
  it('registra e autentica jogador', async () => {
    const repo = new InMemoryJogadorRepository();
    const hasher = new FakePasswordHasher();
    const eventBus = new InMemoryEventBus();

    const register = new RegistrarJogadorUseCase(repo, hasher, eventBus);
    const result = await register.execute({
      username: 'cesar',
      email: 'player@gameparty.com.br',
      displayName: 'Cesar',
      senha: 'senha12345',
      birthDate: '2000-01-01',
      country: 'BR',
      language: 'pt-BR',
      acceptTerms: true,
      confirmAge18: true,
    });

    expect(result.playerId).toBeTruthy();
    expect(eventBus.published).toHaveLength(1);

    const auth = new AutenticarJogadorUseCase(repo, hasher);
    const session = await auth.execute({
      email: 'player@gameparty.com.br',
      senha: 'senha12345',
    });

    expect(session.displayName).toBe('Cesar');
  });

  it('rejeita e-mail duplicado', async () => {
    const repo = new InMemoryJogadorRepository();
    const register = new RegistrarJogadorUseCase(
      repo,
      new FakePasswordHasher(),
      new InMemoryEventBus(),
    );

    await register.execute({
      username: 'ana',
      email: 'a@b.com',
      displayName: 'Ana',
      senha: '12345678',
      birthDate: '2000-01-01',
      country: 'BR',
      language: 'pt-BR',
      acceptTerms: true,
      confirmAge18: true,
    });

    await expect(
      register.execute({
        username: 'bob',
        email: 'a@b.com',
        displayName: 'Bob',
        senha: '12345678',
        birthDate: '1999-05-10',
        country: 'BR',
        language: 'pt-BR',
        acceptTerms: true,
        confirmAge18: true,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejeita nome de exibição duplicado', async () => {
    const repo = new InMemoryJogadorRepository();
    const register = new RegistrarJogadorUseCase(
      repo,
      new FakePasswordHasher(),
      new InMemoryEventBus(),
    );

    await register.execute({
      username: 'flyerx',
      email: 'flyer@b.com',
      displayName: 'FlyerX',
      senha: '12345678',
      birthDate: '2000-01-01',
      country: 'BR',
      language: 'pt-BR',
      acceptTerms: true,
      confirmAge18: true,
    });

    await expect(
      register.execute({
        username: 'outro_user',
        email: 'outro@b.com',
        displayName: 'flyerx',
        senha: '12345678',
        birthDate: '1999-05-10',
        country: 'BR',
        language: 'pt-BR',
        acceptTerms: true,
        confirmAge18: true,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it('rejeita credenciais inválidas', async () => {
    const auth = new AutenticarJogadorUseCase(
      new InMemoryJogadorRepository(),
      new FakePasswordHasher(),
    );

    await expect(
      auth.execute({ email: 'x@y.com', senha: '12345678' }),
    ).rejects.toThrow(UnauthorizedError);
  });

  it('adiciona favorito quando jogo existe', async () => {
    const repo = new InMemoryJogadorRepository();
    const register = new RegistrarJogadorUseCase(
      repo,
      new FakePasswordHasher(),
      new InMemoryEventBus(),
    );
    const { playerId } = await register.execute({
      username: 'ana_fav',
      email: 'fav@b.com',
      displayName: 'Ana',
      senha: '12345678',
      birthDate: '2000-01-01',
      country: 'BR',
      language: 'pt-BR',
      acceptTerms: true,
      confirmAge18: true,
    });

    const gameCatalog = new InMemoryGameCatalogReader([
      {
        id: 'game-1',
        name: 'Valorant',
        slug: 'valorant',
        active: true,
        supportedModes: ['ONLINE'],
      },
    ]);

    const favorito = new AdicionarJogoFavoritoUseCase(repo, gameCatalog);
    const result = await favorito.execute({ playerId, gameId: 'game-1' });

    expect(result.favoritos).toContain('game-1');
  });

  it('rejeita favorito para jogo inexistente', async () => {
    const repo = new InMemoryJogadorRepository();
    const register = new RegistrarJogadorUseCase(
      repo,
      new FakePasswordHasher(),
      new InMemoryEventBus(),
    );
    const { playerId } = await register.execute({
      username: 'ana_fav2',
      email: 'fav2@b.com',
      displayName: 'Ana',
      senha: '12345678',
      birthDate: '2000-01-01',
      country: 'BR',
      language: 'pt-BR',
      acceptTerms: true,
      confirmAge18: true,
    });

    const favorito = new AdicionarJogoFavoritoUseCase(
      repo,
      new InMemoryGameCatalogReader(),
    );

    await expect(
      favorito.execute({ playerId, gameId: 'missing' }),
    ).rejects.toThrow(NotFoundError);
  });
});
