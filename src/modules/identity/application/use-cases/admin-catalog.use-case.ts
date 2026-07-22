import { ApplicationError, ForbiddenError, NotFoundError } from '@shared/application/application.error.js';
import { isAdminRole } from '../../domain/value-objects/player-role.vo.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { CadastrarCategoriaUseCase } from '@catalog/application/use-cases/cadastrar-categoria.use-case.js';
import { CadastrarJogoUseCase } from '@catalog/application/use-cases/cadastrar-jogo.use-case.js';
import { CategoriaId } from '@catalog/domain/value-objects/categoria-id.vo.js';
import { JogoId } from '@catalog/domain/value-objects/jogo-id.vo.js';
import type { CategoriaRepository } from '@catalog/application/ports/categoria.repository.js';
import type { JogoRepository } from '@catalog/application/ports/jogo.repository.js';
import { GameMode } from '@catalog/domain/value-objects/game-mode.vo.js';

async function assertAdmin(jogadorRepo: JogadorRepository, requesterId: string) {
  const admin = await jogadorRepo.findById(JogadorId.create(requesterId));
  if (!admin || !isAdminRole(admin.role)) {
    throw new ForbiddenError('Acesso restrito a administradores');
  }
}

export class CadastrarCategoriaAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly cadastrar: CadastrarCategoriaUseCase,
  ) {}

  async execute(input: { requesterId: string; name: string; slug: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    return this.cadastrar.execute({ name: input.name, slug: input.slug });
  }
}

export class ExcluirCategoriaAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly categoriaRepo: CategoriaRepository,
  ) {}

  async execute(input: { requesterId: string; categoryId: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const categoria = await this.categoriaRepo.findById(CategoriaId.create(input.categoryId));
    if (!categoria) throw new NotFoundError('Categoria', input.categoryId);

    const linkedGames = await this.categoriaRepo.countLinkedGames(categoria.id);
    if (linkedGames > 0) {
      throw new ApplicationError('Remova ou mova os jogos desta categoria antes de excluí-la.');
    }

    await this.categoriaRepo.delete(categoria.id);
    return { categoryId: input.categoryId, deleted: true };
  }
}

export class CadastrarJogoAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly cadastrar: CadastrarJogoUseCase,
  ) {}

  async execute(input: {
    requesterId: string;
    name: string;
    slug: string;
    categoryId: string;
    supportedModes?: GameMode[];
  }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    return this.cadastrar.execute({
      name: input.name,
      slug: input.slug,
      categoryIds: [input.categoryId],
      supportedModes: input.supportedModes ?? [GameMode.ONLINE],
    });
  }
}

export class ExcluirJogoAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly jogoRepo: JogoRepository,
  ) {}

  async execute(input: { requesterId: string; gameId: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const jogo = await this.jogoRepo.findById(JogoId.create(input.gameId));
    if (!jogo) throw new NotFoundError('Jogo', input.gameId);

    await this.jogoRepo.delete(jogo.id);
    return { gameId: input.gameId, deleted: true };
  }
}

export class AlterarStatusJogoAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly jogoRepo: JogoRepository,
  ) {}

  async execute(input: { requesterId: string; gameId: string; active: boolean }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const jogo = await this.jogoRepo.findById(JogoId.create(input.gameId));
    if (!jogo) throw new NotFoundError('Jogo', input.gameId);

    if (input.active) {
      jogo.ativar();
    } else {
      jogo.desativar();
    }

    await this.jogoRepo.save(jogo);
    return {
      gameId: jogo.id.toString(),
      name: jogo.name,
      slug: jogo.slug.toString(),
      active: jogo.active,
    };
  }
}

export class AlterarStatusCategoriaAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly categoriaRepo: CategoriaRepository,
  ) {}

  async execute(input: { requesterId: string; categoryId: string; active: boolean }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const categoria = await this.categoriaRepo.findById(CategoriaId.create(input.categoryId));
    if (!categoria) throw new NotFoundError('Categoria', input.categoryId);

    if (input.active) {
      categoria.ativar();
    } else {
      categoria.desativar();
    }

    await this.categoriaRepo.save(categoria);
    return {
      categoryId: categoria.id.toString(),
      name: categoria.name,
      slug: categoria.slug.toString(),
      active: categoria.active,
    };
  }
}

export class ListarCategoriasAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly categoriaRepo: CategoriaRepository,
  ) {}

  async execute(input: { requesterId: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const categorias = await this.categoriaRepo.listAll();
    return {
      categories: categorias.map((c) => ({
        categoryId: c.id.toString(),
        name: c.name,
        slug: c.slug.toString(),
        active: c.active,
      })),
    };
  }
}
