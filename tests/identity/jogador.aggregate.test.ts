import { describe, expect, it } from 'vitest';
import { Jogador } from '../../src/modules/identity/domain/jogador/jogador.aggregate.js';
import { Email } from '../../src/modules/identity/domain/value-objects/email.vo.js';
import { DisplayName } from '../../src/modules/identity/domain/value-objects/display-name.vo.js';
import {
  FavoritoJaExisteError,
  FavoritoNaoEncontradoError,
} from '../../src/modules/identity/domain/errors/favorito.errors.js';
import { DisplayNameCooldownError } from '../../src/modules/identity/domain/errors/perfil.errors.js';
import { PlayerRole } from '../../src/modules/identity/domain/value-objects/player-role.vo.js';
import { profileChangeCooldownMs } from '../../src/modules/identity/domain/value-objects/profile-change-cooldown.js';

describe('Jogador aggregate', () => {
  it('cria jogador com evento de registro', () => {
    const jogador = Jogador.create({
      username: 'cesar',
      email: 'player@gameparty.com.br',
      displayName: 'Cesar',
      senha: 'senha-segura',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });

    expect(jogador.email.toString()).toBe('player@gameparty.com.br');
    expect(jogador.favoritos).toHaveLength(0);

    const events = jogador.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]?.eventName).toBe('JogadorRegistrado');
  });

  it('gerencia favoritos', () => {
    const jogador = Jogador.create({
      username: 'testuser',
      email: 'a@b.com',
      displayName: 'Test',
      senha: '12345678',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });

    jogador.adicionarFavorito('game-1');
    expect(jogador.favoritos).toContain('game-1');

    jogador.removerFavorito('game-1');
    expect(jogador.favoritos).not.toContain('game-1');
  });

  it('rejeita favorito duplicado', () => {
    const jogador = Jogador.create({
      username: 'testuser',
      email: 'a@b.com',
      displayName: 'Test',
      senha: '12345678',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });
    jogador.adicionarFavorito('game-1');

    expect(() => jogador.adicionarFavorito('game-1')).toThrow(FavoritoJaExisteError);
  });

  it('rejeita remover favorito inexistente', () => {
    const jogador = Jogador.create({
      username: 'testuser',
      email: 'a@b.com',
      displayName: 'Test',
      senha: '12345678',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });

    expect(() => jogador.removerFavorito('x')).toThrow(FavoritoNaoEncontradoError);
  });

  it('bloqueia troca de nick antes de 20 dias', () => {
    const jogador = Jogador.create({
      username: 'testuser',
      email: 'a@b.com',
      displayName: 'Test',
      senha: '12345678',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });

    expect(() => jogador.atualizarDisplayName('OutroNick')).toThrow(DisplayNameCooldownError);
  });

  it('permite troca de nick após 20 dias', () => {
    const jogador = Jogador.create({
      username: 'testuser',
      email: 'a@b.com',
      displayName: 'Test',
      senha: '12345678',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });

    const later = new Date(Date.now() + profileChangeCooldownMs() + 1000);
    jogador.atualizarDisplayName('OutroNick', later);
    expect(jogador.displayName.toString()).toBe('OutroNick');
  });

  it('bloqueia troca de e-mail antes de 20 dias', () => {
    const jogador = Jogador.create({
      username: 'testuser',
      email: 'a@b.com',
      displayName: 'Test',
      senha: '12345678',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });

    expect(() => jogador.atualizarEmail('b@c.com')).toThrow();
  });

  it('admin pode trocar nick e e-mail sem esperar 20 dias', () => {
    const jogador = Jogador.create({
      username: 'adminuser',
      email: 'admin@gameparty.com.br',
      displayName: 'Admin',
      senha: '12345678',
      termsAcceptedAt: new Date(),
      emailVerificationToken: 'test-token',
    });
    jogador.definirRole(PlayerRole.ADMIN);

    expect(jogador.podeAlterarDisplayName()).toBe(true);
    expect(jogador.podeAlterarEmail()).toBe(true);
    jogador.atualizarDisplayName('AdminNovo');
    jogador.atualizarEmail('outro@gameparty.com.br');
    expect(jogador.displayName.toString()).toBe('AdminNovo');
    expect(jogador.email.toString()).toBe('outro@gameparty.com.br');
  });
});

describe('Identity value objects', () => {
  it('valida e-mail', () => {
    expect(() => Email.create('invalid')).toThrow('E-mail inválido');
    expect(Email.create('  User@GameParty.COM  ').toString()).toBe('user@gameparty.com');
  });

  it('valida display name', () => {
    expect(() => DisplayName.create('a')).toThrow();
    expect(DisplayName.create('  Ninja  ').toString()).toBe('Ninja');
    const a = DisplayName.create('FlyerX');
    const b = DisplayName.create('flyerx');
    expect(a.sameAs(b)).toBe(true);
    expect(a.equals(b)).toBe(false);
  });
});
