import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ListarCategoriasUseCase } from '../../application/use-cases/listar-categorias.use-case.js';
import { ListarJogosPorCategoriaUseCase } from '../../application/use-cases/listar-jogos-por-categoria.use-case.js';
import { BuscarJogosUseCase } from '../../application/use-cases/buscar-jogos.use-case.js';
import { ObterJogoPorSlugUseCase } from '../../application/use-cases/obter-jogo-por-slug.use-case.js';
import { CadastrarCategoriaUseCase } from '../../application/use-cases/cadastrar-categoria.use-case.js';
import { CadastrarJogoUseCase } from '../../application/use-cases/cadastrar-jogo.use-case.js';
import { GameMode } from '../../domain/value-objects/game-mode.vo.js';

export function registerCatalogRoutes(
  app: FastifyInstance,
  deps: {
    listarCategorias: ListarCategoriasUseCase;
    listarJogos: ListarJogosPorCategoriaUseCase;
    buscarJogos: BuscarJogosUseCase;
    obterJogo: ObterJogoPorSlugUseCase;
    cadastrarCategoria: CadastrarCategoriaUseCase;
    cadastrarJogo: CadastrarJogoUseCase;
  },
) {
  app.get('/api/categorias', async () => deps.listarCategorias.execute());

  app.get('/api/categorias/:categoryId/jogos', async (request) => {
    const { categoryId } = z.object({ categoryId: z.string().uuid() }).parse(request.params);
    return deps.listarJogos.execute({ categoryId });
  });

  app.get('/api/jogos', async (request) => {
    const query = z.object({
      q: z.string().min(2).max(64),
      limit: z.coerce.number().min(1).max(20).optional(),
    }).parse(request.query);
    return deps.buscarJogos.execute({ q: query.q, limit: query.limit });
  });

  app.get('/api/jogos/:slug', async (request) => {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(request.params);
    return deps.obterJogo.execute({ slug });
  });

  app.post('/api/categorias', async (request, reply) => {
    const body = z.object({ name: z.string().min(1), slug: z.string().min(1) }).parse(request.body);
    const result = await deps.cadastrarCategoria.execute(body);
    return reply.status(201).send(result);
  });

  app.post('/api/jogos', async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(1),
        slug: z.string().min(1),
        categoryIds: z.array(z.string().uuid()),
        supportedModes: z.array(z.nativeEnum(GameMode)).min(1),
      })
      .parse(request.body);
    const result = await deps.cadastrarJogo.execute(body);
    return reply.status(201).send(result);
  });
}
