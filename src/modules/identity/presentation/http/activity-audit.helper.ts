import type { FastifyRequest } from 'fastify';
import type { ActivityLogger } from '../../application/services/activity-logger.service.js';

export function requestActivityContext(request: FastifyRequest) {
  return {
    ip: request.ip,
    userAgent: typeof request.headers['user-agent'] === 'string' ? request.headers['user-agent'] : undefined,
  };
}

export async function logAdminAction(
  activityLogger: ActivityLogger,
  requesterId: string,
  fn: (adminId: string, adminName: string) => Promise<void>,
) {
  const actor = await activityLogger.resolveActor(requesterId);
  await fn(actor.id, actor.name);
}
