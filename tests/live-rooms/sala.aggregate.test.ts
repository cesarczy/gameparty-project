import { describe, expect, it } from 'vitest';
import { Sala } from '../../src/modules/live-rooms/domain/sala/sala.aggregate.js';
import { Mensagem } from '../../src/modules/live-rooms/domain/mensagem/mensagem.aggregate.js';
import { RoomStatus } from '../../src/modules/live-rooms/domain/value-objects/room-status.vo.js';
import {
  CriadorInvalidoError,
  SalaCheiaError,
  SalaEncerradaError,
} from '../../src/modules/live-rooms/domain/errors/sala.errors.js';
import { SalaFixaNaoEncerravelError } from '../../src/modules/live-rooms/domain/errors/sala-fixa.errors.js';
import { Capacity } from '../../src/modules/live-rooms/domain/value-objects/capacity.vo.js';
import { ModoSalaVo } from '../../src/modules/live-rooms/domain/value-objects/modo-sala.vo.js';
import { RoomTitle } from '../../src/modules/live-rooms/domain/value-objects/room-title.vo.js';
import { SalaId } from '../../src/modules/live-rooms/domain/value-objects/sala-id.vo.js';

describe('Sala aggregate', () => {
  const baseInput = {
    gameId: 'game-1',
    creatorId: 'creator-1',
    title: 'LFG ranked',
    mode: 'ONLINE',
    capacity: 3,
  };

  it('cria sala com criador como participante', () => {
    const sala = Sala.create(baseInput);

    expect(sala.participantes).toHaveLength(1);
    expect(sala.status).toBe(RoomStatus.ABERTA);

    const events = sala.pullDomainEvents();
    expect(events.some((e) => e.eventName === 'SalaCriada')).toBe(true);
  });

  it('permite entrar e sair respeitando capacidade', () => {
    const sala = Sala.create(baseInput);
    sala.pullDomainEvents();

    sala.entrar('player-2');
    sala.entrar('player-3');
    expect(sala.status).toBe(RoomStatus.CHEIA);

    expect(() => sala.entrar('player-4')).toThrow(SalaCheiaError);

    sala.sair('player-2');
    expect(sala.status).toBe(RoomStatus.ABERTA);
  });

  it('permite reentrar quando já é participante', () => {
    const sala = Sala.create(baseInput);
    sala.pullDomainEvents();

    sala.entrar('creator-1');
    expect(sala.participantes).toHaveLength(1);
    expect(sala.pullDomainEvents()).toHaveLength(0);
  });

  it('só criador encerra sala não fixa', () => {
    const sala = Sala.create(baseInput);
    sala.entrar('player-2');

    expect(() => sala.encerrar('player-2')).toThrow(CriadorInvalidoError);

    sala.encerrar('creator-1');
    expect(sala.status).toBe(RoomStatus.ENCERRADA);
    expect(() => sala.entrar('player-3')).toThrow(SalaEncerradaError);
  });

  it('impede encerrar sala fixa', () => {
    const sala = Sala.reconstitute({
      id: SalaId.create(),
      gameId: 'game-1',
      creatorId: 'system',
      title: RoomTitle.create('Lobby fixo'),
      mode: ModoSalaVo.create('ONLINE'),
      capacity: Capacity.create(999),
      isFixed: true,
      status: RoomStatus.ABERTA,
      participantes: [],
      createdAt: new Date(),
    });

    expect(() => sala.encerrar('system')).toThrow(SalaFixaNaoEncerravelError);
  });
});

describe('Mensagem aggregate', () => {
  it('cria mensagem válida com evento', () => {
    const mensagem = Mensagem.create({
      roomId: 'room-1',
      authorId: 'player-1',
      content: 'Alguém para ranked?',
    });

    expect(mensagem.content.toString()).toBe('Alguém para ranked?');
    const events = mensagem.pullDomainEvents();
    expect(events[0]?.eventName).toBe('MensagemEnviada');
  });

  it('rejeita conteúdo vazio', () => {
    expect(() =>
      Mensagem.create({ roomId: 'r', authorId: 'p', content: '   ' }),
    ).toThrow('Mensagem não pode ser vazia');
  });
});
