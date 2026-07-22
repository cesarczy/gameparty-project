import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { JwtService } from '@shared/infrastructure/auth/jwt.service.js';
import { UnauthorizedError } from '@shared/application/application.error.js';

declare module 'fastify' {
  interface FastifyRequest {
    playerId?: string;
  }
}

export function registerAuthHook(app: FastifyInstance, jwt: JwtService) {
  app.decorateRequest('playerId', undefined);

  app.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) return;
    const token = header.slice(7);
    try {
      const payload = await jwt.verify(token);
      request.playerId = payload.playerId;
    } catch {
      throw new UnauthorizedError('Token inválido');
    }
  });
}

export function requireAuth(request: FastifyRequest): string {
  if (!request.playerId) {
    throw new UnauthorizedError('Autenticação necessária');
  }
  return request.playerId;
}
