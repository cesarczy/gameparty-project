import { describe, expect, it } from 'vitest';
import { buildTestApp } from '../../src/test-app.js';

describe('API smoke — MVP flow', () => {
  it('registra jogador, entra no lobby fixo e envia mensagem', async () => {
    const { app, seed } = await buildTestApp();

    const register = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        username: 'cesar',
        email: 'player@gameparty.com.br',
        displayName: 'Cesar',
        senha: 'senha12345',
        birthDate: '2000-01-01',
        country: 'BR',
        language: 'pt-BR',
        acceptTerms: true,
        confirmAge18: true,
      },
    });

    expect(register.statusCode).toBe(201);
    const { token } = register.json();
    expect(token).toBeTruthy();

    const lobby = await app.inject({
      method: 'GET',
      url: '/api/jogos/valorant/lobby',
    });

    expect(lobby.statusCode).toBe(200);
    const { roomId } = lobby.json();
    expect(roomId).toBe(seed.fixedLobby.id.toString());

    const join = await app.inject({
      method: 'POST',
      url: `/api/salas/${roomId}/entrar`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(join.statusCode).toBe(200);

    const message = await app.inject({
      method: 'POST',
      url: `/api/salas/${roomId}/mensagens`,
      headers: { authorization: `Bearer ${token}` },
      payload: { content: 'Alguém para ranked?' },
    });

    expect(message.statusCode).toBe(201);
    expect(message.json().content).toBe('Alguém para ranked?');

    const list = await app.inject({
      method: 'GET',
      url: `/api/salas?gameId=${seed.valorant.id.toString()}`,
    });

    expect(list.json().rooms).toHaveLength(1);
    expect(list.json().rooms[0].participantCount).toBe(1);

    await app.close();
  });

  it('health check responde ok', async () => {
    const { app } = await buildTestApp();
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.json()).toEqual({ status: 'ok' });
    await app.close();
  });
});
