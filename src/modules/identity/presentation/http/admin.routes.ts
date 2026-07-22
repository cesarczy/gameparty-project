import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { JwtService } from '@shared/infrastructure/auth/jwt.service.js';
import type { JogadorRepository } from '../../application/ports/jogador.repository.js';
import {
  DefinirRoleJogadorUseCase,
  ListarDenunciasAdminUseCase,
  ListarJogadoresAdminUseCase,
  ListarJogosAdminUseCase,
  ListarSalasAtivasAdminUseCase,
  ObterPainelAdminUseCase,
} from '../../application/use-cases/admin.use-case.js';
import {
  AtualizarJogadorAdminUseCase,
  BanirJogadorAdminUseCase,
  BuscarJogadoresAdminUseCase,
  ExcluirJogadorAdminUseCase,
  ObterJogadorAdminUseCase,
} from '../../application/use-cases/admin-jogador.use-case.js';
import {
  CadastrarCategoriaAdminUseCase,
  CadastrarJogoAdminUseCase,
  ExcluirCategoriaAdminUseCase,
  ExcluirJogoAdminUseCase,
  AlterarStatusJogoAdminUseCase,
  AlterarStatusCategoriaAdminUseCase,
  ListarCategoriasAdminUseCase,
} from '../../application/use-cases/admin-catalog.use-case.js';
import {
  ListarLogsGlobaisAdminUseCase,
  ListarLogsJogadorAdminUseCase,
} from '../../application/use-cases/activity-log.use-case.js';
import type { ActivityLogger } from '../../application/services/activity-logger.service.js';
import { logAdminAction } from './activity-audit.helper.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { PlayerRole } from '../../domain/value-objects/player-role.vo.js';
import { requireAuth } from '@shared/presentation/http/auth.hook.js';

function collectAdminPlayerChanges(
  before: {
    username: string;
    email: string;
    displayName: string;
    role: string;
    country: string | null;
    birthDate: string | null;
    language: string;
    emailVerified: boolean;
    chatOnline: boolean;
    rankId: string | null;
  },
  after: typeof before,
  body: Record<string, unknown>,
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  const track = (field: keyof typeof before) => {
    if (body[field] === undefined) return;
    if (before[field] !== after[field]) {
      changes[field] = { from: before[field], to: after[field] };
    }
  };

  track('username');
  track('email');
  track('displayName');
  track('role');
  track('country');
  track('birthDate');
  track('language');
  track('emailVerified');
  track('chatOnline');
  track('rankId');
  if (body.senha !== undefined) {
    changes.senha = { from: '***', to: '(alterada)' };
  }
  return changes;
}

export function registerAdminRoutes(
  app: FastifyInstance,
  deps: {
    obterPainel: ObterPainelAdminUseCase;
    listarJogadores: ListarJogadoresAdminUseCase;
    listarDenuncias: ListarDenunciasAdminUseCase;
    listarSalasAtivas: ListarSalasAtivasAdminUseCase;
    listarJogos: ListarJogosAdminUseCase;
    buscarJogadores: BuscarJogadoresAdminUseCase;
    obterJogador: ObterJogadorAdminUseCase;
    atualizarJogador: AtualizarJogadorAdminUseCase;
    banirJogador: BanirJogadorAdminUseCase;
    excluirJogador: ExcluirJogadorAdminUseCase;
    cadastrarCategoria: CadastrarCategoriaAdminUseCase;
    excluirCategoria: ExcluirCategoriaAdminUseCase;
    cadastrarJogo: CadastrarJogoAdminUseCase;
    excluirJogo: ExcluirJogoAdminUseCase;
    alterarStatusJogo: AlterarStatusJogoAdminUseCase;
    alterarStatusCategoria: AlterarStatusCategoriaAdminUseCase;
    listarCategoriasAdmin: ListarCategoriasAdminUseCase;
    listarLogsJogador: ListarLogsJogadorAdminUseCase;
    listarLogsGlobais: ListarLogsGlobaisAdminUseCase;
    definirRole: DefinirRoleJogadorUseCase;
    activityLogger: ActivityLogger;
    jwt: JwtService;
    jogadorRepo: JogadorRepository;
  },
) {
  app.get('/api/admin/painel', async (request) => {
    const requesterId = requireAuth(request);
    return deps.obterPainel.execute({ requesterId });
  });

  app.get('/api/admin/jogadores', async (request) => {
    const requesterId = requireAuth(request);
    return deps.listarJogadores.execute({ requesterId });
  });

  app.get('/api/admin/denuncias', async (request) => {
    const requesterId = requireAuth(request);
    return deps.listarDenuncias.execute({ requesterId });
  });

  app.get('/api/admin/salas-ativas', async (request) => {
    const requesterId = requireAuth(request);
    return deps.listarSalasAtivas.execute({ requesterId });
  });

  app.get('/api/admin/categorias', async (request) => {
    const requesterId = requireAuth(request);
    return deps.listarCategoriasAdmin.execute({ requesterId });
  });

  app.get('/api/admin/jogadores/:playerId/logs', async (request) => {
    const requesterId = requireAuth(request);
    const { playerId } = z.object({ playerId: z.string().uuid() }).parse(request.params);
    return deps.listarLogsJogador.execute({ requesterId, targetPlayerId: playerId });
  });

  app.get('/api/admin/logs', async (request) => {
    const requesterId = requireAuth(request);
    return deps.listarLogsGlobais.execute({ requesterId });
  });

  app.get('/api/admin/jogos', async (request) => {
    const requesterId = requireAuth(request);
    return deps.listarJogos.execute({ requesterId });
  });

  app.get('/api/admin/jogadores/busca', async (request) => {
    const requesterId = requireAuth(request);
    const query = z.object({
      q: z.string().min(2).max(64),
      limit: z.coerce.number().min(1).max(20).optional(),
    }).parse(request.query);
    return deps.buscarJogadores.execute({
      requesterId,
      q: query.q,
      limit: query.limit,
    });
  });

  app.get('/api/admin/jogadores/:playerId', async (request) => {
    const requesterId = requireAuth(request);
    const { playerId } = z.object({ playerId: z.string().uuid() }).parse(request.params);
    return deps.obterJogador.execute({ requesterId, targetPlayerId: playerId });
  });

  app.patch('/api/admin/jogadores/:playerId', async (request) => {
    const requesterId = requireAuth(request);
    const { playerId } = z.object({ playerId: z.string().uuid() }).parse(request.params);
    const body = z.object({
      username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
      email: z.string().email().optional(),
      displayName: z.string().min(2).max(32).optional(),
      role: z.enum(['PLAYER', 'ADMIN']).optional(),
      country: z.string().max(64).nullable().optional(),
      birthDate: z.string().nullable().optional(),
      language: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
      emailVerified: z.boolean().optional(),
      chatOnline: z.boolean().optional(),
      rankId: z.string().nullable().optional(),
      senha: z.string().min(8).optional(),
    }).parse(request.body);

    const before = await deps.obterJogador.execute({ requesterId, targetPlayerId: playerId });
    const result = await deps.atualizarJogador.execute({
      requesterId,
      targetPlayerId: playerId,
      ...body,
      role: body.role as PlayerRole | undefined,
    });

    const changes = collectAdminPlayerChanges(before, result, body);
    if (Object.keys(changes).length > 0) {
      await logAdminAction(deps.activityLogger, requesterId, async (adminId, adminName) => {
        await deps.activityLogger.logAdminPlayerUpdated(
          playerId,
          result.displayName,
          adminId,
          adminName,
          changes,
        );
      });
    }

    return result;
  });

  app.post('/api/admin/jogadores/:playerId/ban', async (request) => {
    const requesterId = requireAuth(request);
    const { playerId } = z.object({ playerId: z.string().uuid() }).parse(request.params);
    const body = z.object({ banned: z.boolean() }).parse(request.body);
    const target = await deps.obterJogador.execute({ requesterId, targetPlayerId: playerId });
    const result = await deps.banirJogador.execute({
      requesterId,
      targetPlayerId: playerId,
      banned: body.banned,
    });
    await logAdminAction(deps.activityLogger, requesterId, async (adminId, adminName) => {
      if (body.banned) {
        await deps.activityLogger.logUserBanned(
          playerId,
          target.displayName,
          adminId,
          adminName,
          new Date().toISOString(),
        );
      } else {
        await deps.activityLogger.logUserUnbanned(playerId, target.displayName, adminId, adminName);
      }
    });
    return result;
  });

  app.delete('/api/admin/jogadores/:playerId', async (request) => {
    const requesterId = requireAuth(request);
    const { playerId } = z.object({ playerId: z.string().uuid() }).parse(request.params);
    return deps.excluirJogador.execute({ requesterId, targetPlayerId: playerId });
  });

  app.post('/api/admin/categorias', async (request, reply) => {
    const requesterId = requireAuth(request);
    const body = z.object({ name: z.string().min(1).max(64), slug: z.string().min(1).max(64) }).parse(request.body);
    const result = await deps.cadastrarCategoria.execute({ requesterId, ...body });
    return reply.status(201).send(result);
  });

  app.delete('/api/admin/categorias/:categoryId', async (request) => {
    const requesterId = requireAuth(request);
    const { categoryId } = z.object({ categoryId: z.string().uuid() }).parse(request.params);
    return deps.excluirCategoria.execute({ requesterId, categoryId });
  });

  app.post('/api/admin/jogos', async (request, reply) => {
    const requesterId = requireAuth(request);
    const body = z.object({
      name: z.string().min(1).max(120),
      slug: z.string().min(1).max(120),
      categoryId: z.string().uuid(),
    }).parse(request.body);
    const result = await deps.cadastrarJogo.execute({ requesterId, ...body });
    return reply.status(201).send(result);
  });

  app.delete('/api/admin/jogos/:gameId', async (request) => {
    const requesterId = requireAuth(request);
    const { gameId } = z.object({ gameId: z.string().uuid() }).parse(request.params);
    return deps.excluirJogo.execute({ requesterId, gameId });
  });

  app.patch('/api/admin/jogos/:gameId/status', async (request) => {
    const requesterId = requireAuth(request);
    const { gameId } = z.object({ gameId: z.string().uuid() }).parse(request.params);
    const body = z.object({ active: z.boolean() }).parse(request.body);
    const result = await deps.alterarStatusJogo.execute({ requesterId, gameId, active: body.active });
    await logAdminAction(deps.activityLogger, requesterId, async (adminId, adminName) => {
      await deps.activityLogger.logGameStatus(result.name, result.active, adminId, adminName);
    });
    return result;
  });

  app.patch('/api/admin/categorias/:categoryId/status', async (request) => {
    const requesterId = requireAuth(request);
    const { categoryId } = z.object({ categoryId: z.string().uuid() }).parse(request.params);
    const body = z.object({ active: z.boolean() }).parse(request.body);
    const result = await deps.alterarStatusCategoria.execute({
      requesterId,
      categoryId,
      active: body.active,
    });
    await logAdminAction(deps.activityLogger, requesterId, async (adminId, adminName) => {
      await deps.activityLogger.logCategoryStatus(result.name, result.active, adminId, adminName);
    });
    return result;
  });

  app.patch('/api/admin/jogadores/:playerId/role', async (request) => {
    const requesterId = requireAuth(request);
    const { playerId } = z.object({ playerId: z.string().uuid() }).parse(request.params);
    const body = z.object({ role: z.enum(['PLAYER', 'ADMIN']) }).parse(request.body);

    const target = await deps.obterJogador.execute({ requesterId, targetPlayerId: playerId });
    const result = await deps.definirRole.execute({
      requesterId,
      targetPlayerId: playerId,
      role: body.role as PlayerRole,
    });

    await logAdminAction(deps.activityLogger, requesterId, async (adminId, adminName) => {
      await deps.activityLogger.logRoleChanged(
        playerId,
        target.displayName,
        adminId,
        adminName,
        body.role,
      );
    });

    if (requesterId === playerId) {
      const jogador = await deps.jogadorRepo.findById(JogadorId.create(playerId));
      if (jogador) {
        const token = await deps.jwt.sign({
          playerId: jogador.id.toString(),
          displayName: jogador.displayName.toString(),
          role: jogador.role,
        });
        return { ...result, token };
      }
    }

    return result;
  });
}
