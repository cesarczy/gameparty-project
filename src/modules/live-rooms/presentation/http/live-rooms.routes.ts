import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { WebSocket } from '@fastify/websocket';
import { ListarSalasAtivasUseCase } from '../../application/use-cases/listar-salas-ativas.use-case.js';
import { ObterLobbyPorSlugUseCase } from '../../application/use-cases/obter-lobby-por-slug.use-case.js';
import { ObterSalaUseCase } from '../../application/use-cases/obter-sala.use-case.js';
import { ListarMensagensSalaUseCase } from '../../application/use-cases/listar-mensagens-sala.use-case.js';
import { EntrarNaSalaUseCase } from '../../application/use-cases/entrar-na-sala.use-case.js';
import { SairDaSalaUseCase } from '../../application/use-cases/sair-da-sala.use-case.js';
import { EnviarMensagemUseCase } from '../../application/use-cases/enviar-mensagem.use-case.js';
import { MESSAGE_CONTENT_MAX_LENGTH } from '../../domain/value-objects/message-content.constants.js';
import type { ChatRoomHub } from '../../infrastructure/messaging/chat-room.hub.js';
import { requireAuth } from '@shared/presentation/http/auth.hook.js';

export function registerLiveRoomsRoutes(
  app: FastifyInstance,
  deps: {
    listarSalas: ListarSalasAtivasUseCase;
    obterLobby: ObterLobbyPorSlugUseCase;
    obterSala: ObterSalaUseCase;
    listarMensagens: ListarMensagensSalaUseCase;
    entrar: EntrarNaSalaUseCase;
    sair: SairDaSalaUseCase;
    enviarMensagem: EnviarMensagemUseCase;
    chatHub: ChatRoomHub;
  },
) {
  app.get('/api/salas', async (request) => {
    const query = z
      .object({
        gameId: z.string().uuid().optional(),
        categoryId: z.string().uuid().optional(),
      })
      .parse(request.query);
    return deps.listarSalas.execute(query);
  });

  app.get('/api/jogos/:slug/lobby', async (request) => {
    const { slug } = z.object({ slug: z.string().min(1) }).parse(request.params);
    return deps.obterLobby.execute({ slug });
  });

  app.get('/api/salas/:roomId', async (request) => {
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    return deps.obterSala.execute({ roomId });
  });

  app.get('/api/salas/:roomId/mensagens', async (request) => {
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    const query = z.object({ limit: z.coerce.number().min(1).max(100).optional() }).parse(request.query);
    return deps.listarMensagens.execute({ roomId, limit: query.limit });
  });

  app.post('/api/salas/:roomId/entrar', async (request) => {
    const playerId = requireAuth(request);
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    const result = await deps.entrar.execute({ roomId, playerId });
    deps.chatHub.broadcast(roomId, {
      type: 'participantCount',
      roomId,
      participantCount: result.participantCount,
    });
    return result;
  });

  app.post('/api/salas/:roomId/sair', async (request) => {
    const playerId = requireAuth(request);
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    const result = await deps.sair.execute({ roomId, playerId });
    deps.chatHub.broadcast(roomId, {
      type: 'participantCount',
      roomId,
      participantCount: result.participantCount,
    });
    return result;
  });

  app.post('/api/salas/:roomId/mensagens', async (request, reply) => {
    const playerId = requireAuth(request);
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    const body = z.object({ content: z.string().min(1).max(MESSAGE_CONTENT_MAX_LENGTH) }).parse(request.body);
    const result = await deps.enviarMensagem.execute({
      roomId,
      authorId: playerId,
      content: body.content,
    });
    deps.chatHub.broadcast(roomId, {
      type: 'message',
      messageId: result.messageId,
      roomId: result.roomId,
      authorId: result.authorId,
      authorDisplayName: result.authorDisplayName,
      authorRole: result.authorRole,
      authorAvatarUrl: result.authorAvatarUrl,
      content: result.content,
      sentAt: result.sentAt,
    });
    return reply.status(201).send(result);
  });

  app.get('/ws/salas/:roomId', { websocket: true }, (socket: WebSocket, request) => {
    const { roomId } = z.object({ roomId: z.string().uuid() }).parse(request.params);
    deps.chatHub.join(roomId, socket);
    socket.send(JSON.stringify({ type: 'connected', roomId }));
  });
}
