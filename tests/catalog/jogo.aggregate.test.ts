import { describe, expect, it } from 'vitest';
import { Jogo } from '../../src/modules/catalog/domain/jogo/jogo.aggregate.js';
import { Categoria } from '../../src/modules/catalog/domain/categoria/categoria.aggregate.js';
import { GameMode } from '../../src/modules/catalog/domain/value-objects/game-mode.vo.js';
import { Slug } from '../../src/modules/catalog/domain/value-objects/slug.vo.js';
import { JogoSemModoError } from '../../src/modules/catalog/domain/errors/jogo.errors.js';

describe('Jogo aggregate', () => {
  it('cadastra jogo com modos e emite evento', () => {
    const jogo = Jogo.create({
      name: 'Valorant',
      slug: 'valorant',
      categoryIds: ['cat-fps'],
      supportedModes: [GameMode.ONLINE],
    });

    expect(jogo.slug.toString()).toBe('valorant');
    expect(jogo.suportaModo(GameMode.ONLINE)).toBe(true);

    const events = jogo.pullDomainEvents();
    expect(events[0]?.eventName).toBe('JogoCadastrado');
  });

  it('exige ao menos um modo', () => {
    expect(() =>
      Jogo.create({
        name: 'X',
        slug: 'x',
        categoryIds: [],
        supportedModes: [],
      }),
    ).toThrow(JogoSemModoError);
  });
});

describe('Categoria aggregate', () => {
  it('cria categoria com slug válido', () => {
    const categoria = Categoria.create({ name: 'FPS', slug: 'fps' });
    expect(categoria.name).toBe('FPS');
    expect(categoria.slug.equals(Slug.create('fps'))).toBe(true);
  });
});

describe('Slug VO', () => {
  it('rejeita slug inválido', () => {
    expect(() => Slug.create('FPS Game!')).toThrow('Slug inválido');
  });
});
