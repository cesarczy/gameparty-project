import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { WebSocket } from '@fastify/websocket';
import { requireAuth } from '@shared/presentation/http/auth.hook.js';
import type { JwtService } from '@shared/infrastructure/auth/jwt.service.js';
import type {
  AtualizarConfiguracoesUseCase,
  ObterPerfilPublicoUseCase,
  SocialUseCases,
} from '../../application/use-cases/social.use-cases.js';
import type { ActivityLogger } from '../../application/services/activity-logger.service.js';
import type { JogadorRepository } from '../../application/ports/jogador.repository.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { PrivateMessageHub } from '../../infrastructure/messaging/private-message.hub.js';

export function registerSocialRoutes(
  app: FastifyInstance,
  deps: {
    social: SocialUseCases;
    obterPerfilPublico: ObterPerfilPublicoUseCase;
    atualizarConfiguracoes: AtualizarConfiguracoesUseCase;
    activityLogger: ActivityLogger;
    jogadorRepo: JogadorRepository;
    privateMessageHub: PrivateMessageHub;
    jwt: JwtService;
  },
) {
  app.get('/api/jogadores/:playerId', async (request) => {
    const { playerId } = z.object({ playerId: z.string().uuid() }).parse(request.params);
    const viewerId = request.playerId;
    return deps.obterPerfilPublico.execute({ playerId, viewerId });
  });

  app.patch('/api/profile/me/configuracoes', async (request) => {
    const playerId = requireAuth(request);
    const body = z
      .object({
        profanityFilterEnabled: z.boolean().optional(),
        chatOnline: z.boolean().optional(),
        theme: z.enum(['dark', 'light']).optional(),
        language: z.enum(['pt-BR', 'en-US', 'es-ES']).optional(),
      })
      .parse(request.body);
    return deps.atualizarConfiguracoes.execute({ playerId, ...body });
  });

  app.post('/api/social/amigos', async (request, reply) => {
    const playerId = requireAuth(request);
    const body = z.object({ playerId: z.string().uuid() }).parse(request.body);
    const result = await deps.social.addFriend(playerId, body.playerId);
    return reply.status(201).send(result);
  });

  app.post('/api/social/amigos/:requesterId/aceitar', async (request) => {
    const playerId = requireAuth(request);
    const { requesterId } = z.object({ requesterId: z.string().uuid() }).parse(request.params);
    return deps.social.acceptFriend(playerId, requesterId);
  });

  app.get('/api/social/amigos', async (request) => {
    const playerId = requireAuth(request);
    return deps.social.listFriends(playerId);
  });

  app.get('/api/social/amigos/pendentes', async (request) => {
    const playerId = requireAuth(request);
    return deps.social.listPending(playerId);
  });

  app.post('/api/social/bloqueios', async (request, reply) => {
    const playerId = requireAuth(request);
    const body = z.object({ playerId: z.string().uuid() }).parse(request.body);
    const result = await deps.social.blockPlayer(playerId, body.playerId);
    return reply.status(201).send(result);
  });

  app.delete('/api/social/bloqueios/:blockedId', async (request) => {
    const playerId = requireAuth(request);
    const { blockedId } = z.object({ blockedId: z.string().uuid() }).parse(request.params);
    return deps.social.unblockPlayer(playerId, blockedId);
  });

  app.get('/api/social/bloqueios', async (request) => {
    const playerId = requireAuth(request);
    return deps.social.listBlocked(playerId);
  });

  app.post('/api/social/denuncias', async (request, reply) => {
    const playerId = requireAuth(request);
    const body = z
      .object({
        reportedId: z.string().uuid(),
        reason: z.enum(['SPAM', 'TOXICIDADE', 'OFENSA', 'ASSEDIO', 'HACK', 'FAKE', 'OUTRO']),
        details: z.string().min(10).max(2000),
      })
      .parse(request.body);
    const result = await deps.social.reportPlayer({ reporterId: playerId, ...body });
    const [reporter, reported] = await Promise.all([
      deps.jogadorRepo.findById(JogadorId.create(playerId)),
      deps.jogadorRepo.findById(JogadorId.create(body.reportedId)),
    ]);
    if (reporter && reported) {
      await deps.activityLogger.logReportReceived(
        body.reportedId,
        reported.displayName.toString(),
        playerId,
        reporter.displayName.toString(),
        body.reason,
      );
    }
    return reply.status(201).send(result);
  });

  app.get('/api/social/notificacoes', async (request) => {
    const playerId = requireAuth(request);
    return deps.social.listNotifications(playerId);
  });

  app.patch('/api/social/notificacoes/:id/lida', async (request) => {
    const playerId = requireAuth(request);
    const { id } = z.object({ id: z.string().uuid() }).parse(request.params);
    return deps.social.markNotificationRead(playerId, id);
  });

  app.post('/api/social/mensagens', async (request, reply) => {
    const playerId = requireAuth(request);
    const body = z
      .object({
        receiverId: z.string().uuid(),
        content: z.string().min(1).max(2000),
      })
      .parse(request.body);
    const result = await deps.social.sendPrivateMessage(playerId, body.receiverId, body.content);
    deps.privateMessageHub.notifyMessage({
      type: 'privateMessage',
      messageId: result.messageId,
      senderId: result.senderId,
      receiverId: result.receiverId,
      senderDisplayName: result.senderDisplayName,
      content: result.content,
      sentAt: result.sentAt,
    });
    return reply.status(201).send(result);
  });

  app.get('/api/social/mensagens/:peerId', async (request) => {
    const playerId = requireAuth(request);
    const { peerId } = z.object({ peerId: z.string().uuid() }).parse(request.params);
    return deps.social.listPrivateMessages(playerId, peerId);
  });

  app.get('/api/social/conversas', async (request) => {
    const playerId = requireAuth(request);
    return deps.social.listConversations(playerId);
  });

  app.get('/ws/social/mensagens', { websocket: true }, async (socket: WebSocket, request) => {
    const query = z.object({ token: z.string().min(1) }).parse(request.query);
    try {
      const payload = await deps.jwt.verify(query.token);
      deps.privateMessageHub.join(payload.playerId, socket);
      socket.send(JSON.stringify({ type: 'connected', playerId: payload.playerId }));
    } catch {
      socket.close();
    }
  });
}
