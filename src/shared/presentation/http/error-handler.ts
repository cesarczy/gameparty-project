import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { DomainError } from '@shared/domain/domain.error.js';
import {
  ApplicationError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@shared/application/application.error.js';
import { ContaGoogleSemSenhaError } from '@identity/domain/errors/google-auth.errors.js';
import {
  AvatarUrlInvalidaError,
  AvatarArquivoInvalidoError,
  SenhaAtualInvalidaError,
} from '@identity/domain/errors/perfil.errors.js';

export function mapErrorToStatus(error: unknown): { status: number; message: string } {
  if (error instanceof NotFoundError) {
    return { status: 404, message: error.message };
  }
  if (error instanceof ConflictError) {
    return { status: 409, message: error.message };
  }
  if (error instanceof UnauthorizedError) {
    return { status: 401, message: error.message };
  }
  if (error instanceof ContaGoogleSemSenhaError) {
    return { status: 400, message: error.message };
  }
  if (error instanceof SenhaAtualInvalidaError) {
    return { status: 422, message: error.message };
  }
  if (error instanceof AvatarUrlInvalidaError || error instanceof AvatarArquivoInvalidoError) {
    return { status: 422, message: error.message };
  }
  if (error instanceof ForbiddenError) {
    return { status: 403, message: error.message };
  }
  if (error instanceof DomainError) {
    return { status: 422, message: error.message };
  }
  if (error instanceof ApplicationError) {
    return { status: 400, message: error.message };
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'FST_ERR_CTP_EMPTY_JSON_BODY'
  ) {
    return { status: 400, message: 'Corpo da requisição inválido' };
  }
  return { status: 500, message: 'Erro interno do servidor' };
}

export function registerErrorHandler(app: {
  setErrorHandler: (
    handler: (error: FastifyError, request: FastifyRequest, reply: FastifyReply) => void,
  ) => void;
}) {
  app.setErrorHandler((error, request, reply) => {
    const mapped = mapErrorToStatus(error);
    request.log.error({ err: error, requestId: request.id }, mapped.message);
    reply.status(mapped.status).send({ error: mapped.message });
  });
}
