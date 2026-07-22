import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AutenticarGoogleUseCase } from '../../application/use-cases/autenticar-google.use-case.js';
import { RegistrarJogadorUseCase } from '../../application/use-cases/registrar-jogador.use-case.js';
import { AutenticarJogadorUseCase } from '../../application/use-cases/autenticar-jogador.use-case.js';
import { ObterPerfilUseCase } from '../../application/use-cases/obter-perfil.use-case.js';
import { AtualizarPerfilUseCase } from '../../application/use-cases/atualizar-perfil.use-case.js';
import { AlterarEmailUseCase } from '../../application/use-cases/alterar-email.use-case.js';
import { AlterarSenhaUseCase } from '../../application/use-cases/alterar-senha.use-case.js';
import { UploadAvatarUseCase } from '../../application/use-cases/upload-avatar.use-case.js';
import { AdicionarJogoFavoritoUseCase } from '../../application/use-cases/adicionar-jogo-favorito.use-case.js';
import { RemoverJogoFavoritoUseCase } from '../../application/use-cases/remover-jogo-favorito.use-case.js';
import { VerificarEmailUseCase } from '../../application/use-cases/verificar-email.use-case.js';
import { SolicitarRecuperacaoSenhaUseCase } from '../../application/use-cases/solicitar-recuperacao-senha.use-case.js';
import { RedefinirSenhaUseCase } from '../../application/use-cases/redefinir-senha.use-case.js';
import type { JwtService } from '@shared/infrastructure/auth/jwt.service.js';
import { requireAuth } from '@shared/presentation/http/auth.hook.js';
import { ApplicationError, UnauthorizedError } from '@shared/application/application.error.js';
import type { ActivityLogger } from '../../application/services/activity-logger.service.js';
import { requestActivityContext } from './activity-audit.helper.js';
import type { JogadorRepository } from '../../application/ports/jogador.repository.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  senha: z.string().min(8),
  fullName: z.string().min(2).max(120),
  displayName: z.string().min(2).max(32),
  birthDate: z.string().min(1).refine((value) => {
    const birth = new Date(`${value}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age >= 18;
  }, { message: 'É necessário ter 18 anos ou mais' }),
  country: z.string().min(1).max(64),
  language: z.enum(['pt-BR', 'en-US', 'es-ES']),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Aceite os Termos de Uso' }) }),
  confirmAge18: z.literal(true, { errorMap: () => ({ message: 'Confirme que tem 18 anos ou mais' }) }),
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(8),
});

async function issueAuthResponse(
  jwt: JwtService,
  profile: {
    playerId: string;
    displayName: string;
    role: string;
    avatarUrl: string | null;
  },
) {
  const token = await jwt.sign({
    playerId: profile.playerId,
    displayName: profile.displayName,
    role: profile.role,
  });
  return { ...profile, token };
}

export function registerIdentityRoutes(
  app: FastifyInstance,
  deps: {
    registrar: RegistrarJogadorUseCase;
    autenticar: AutenticarJogadorUseCase;
    autenticarGoogle: AutenticarGoogleUseCase;
    obterPerfil: ObterPerfilUseCase;
    atualizarPerfil: AtualizarPerfilUseCase;
    alterarEmail: AlterarEmailUseCase;
    alterarSenha: AlterarSenhaUseCase;
    uploadAvatar: UploadAvatarUseCase;
    adicionarFavorito: AdicionarJogoFavoritoUseCase;
    removerFavorito: RemoverJogoFavoritoUseCase;
    verificarEmail: VerificarEmailUseCase;
    solicitarRecuperacaoSenha: SolicitarRecuperacaoSenhaUseCase;
    redefinirSenha: RedefinirSenhaUseCase;
    jwt: JwtService;
    activityLogger: ActivityLogger;
    jogadorRepo: JogadorRepository;
  },
) {
  app.post('/api/auth/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const result = await deps.registrar.execute(body);
    const auth = await issueAuthResponse(deps.jwt, result);
    return reply.status(201).send({
      ...auth,
      username: result.username,
      emailVerificationRequired: result.emailVerificationRequired,
      verificationMessage: result.verificationMessage,
    });
  });

  app.get('/api/auth/verify-email', async (request) => {
    const query = z.object({ token: z.string().min(10) }).parse(request.query);
    const result = await deps.verificarEmail.execute({ token: query.token });
    if (result.verified && !result.alreadyVerified && result.playerId && result.displayName) {
      await deps.activityLogger.logEmailVerified(result.playerId, result.displayName);
    }
    return result;
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const ctx = requestActivityContext(request);
    try {
      const result = await deps.autenticar.execute(body);
      await deps.activityLogger.logLogin(result.playerId, result.displayName, ctx);
      return reply.send(await issueAuthResponse(deps.jwt, result));
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        await deps.activityLogger.logLoginFailed(body.email, ctx);
      }
      throw error;
    }
  });

  app.post('/api/auth/google', async (request, reply) => {
    const body = z.object({ idToken: z.string().min(10) }).parse(request.body);
    const result = await deps.autenticarGoogle.execute({ idToken: body.idToken });
    await deps.activityLogger.logLogin(result.playerId, result.displayName, requestActivityContext(request));
    return reply.send(await issueAuthResponse(deps.jwt, result));
  });

  app.post('/api/auth/forgot-password', async (request) => {
    const body = z.object({ email: z.string().email() }).parse(request.body);
    return deps.solicitarRecuperacaoSenha.execute({ email: body.email });
  });

  app.post('/api/auth/reset-password', async (request) => {
    const body = z.object({
      token: z.string().min(10),
      senha: z.string().min(8),
    }).parse(request.body);
    const jogador = await deps.jogadorRepo.findByPasswordResetToken(body.token);
    const result = await deps.redefinirSenha.execute(body);
    if (jogador) {
      await deps.activityLogger.logPasswordChanged(jogador.id.toString(), jogador.displayName.toString());
    }
    return result;
  });

  app.post('/api/auth/logout', async (request) => {
    const playerId = requireAuth(request);
    const profile = await deps.obterPerfil.execute({ playerId });
    const jogador = await deps.jogadorRepo.findById(JogadorId.create(playerId));
    if (jogador) {
      jogador.marcarAusente();
      await deps.jogadorRepo.save(jogador);
    }
    await deps.activityLogger.logLogout(playerId, profile.displayName, requestActivityContext(request));
    return { ok: true };
  });

  app.get('/api/profile/me', async (request) => {
    const playerId = requireAuth(request);
    return deps.obterPerfil.execute({ playerId });
  });

  app.patch('/api/profile/me', async (request) => {
    const playerId = requireAuth(request);
    const body = z.object({ displayName: z.string().min(2).max(32) }).parse(request.body);
    const before = await deps.obterPerfil.execute({ playerId });
    await deps.atualizarPerfil.execute({ playerId, displayName: body.displayName });
    const profile = await deps.obterPerfil.execute({ playerId });
    if (before.displayName !== profile.displayName) {
      await deps.activityLogger.logDisplayNameChanged(playerId, profile.displayName, before.displayName);
    }
    const token = await deps.jwt.sign({
      playerId: profile.playerId,
      displayName: profile.displayName,
      role: profile.role,
    });
    return {
      playerId: profile.playerId,
      displayName: profile.displayName,
      token,
    };
  });

  app.patch('/api/profile/me/email', async (request) => {
    const playerId = requireAuth(request);
    const body = z
      .object({
        novoEmail: z.string().email(),
        senhaAtual: z.string().min(8).optional(),
      })
      .parse(request.body);
    const before = await deps.obterPerfil.execute({ playerId });
    const result = await deps.alterarEmail.execute({ playerId, ...body });
    if (before.email !== result.email) {
      await deps.activityLogger.logEmailChanged(playerId, before.displayName, before.email, result.email);
    }
    return result;
  });

  app.patch('/api/profile/me/senha', async (request) => {
    const playerId = requireAuth(request);
    const body = z
      .object({
        senhaAtual: z.string().min(8).optional(),
        senhaNova: z.string().min(8),
      })
      .parse(request.body);
    const profile = await deps.obterPerfil.execute({ playerId });
    const result = await deps.alterarSenha.execute({ playerId, ...body });
    await deps.activityLogger.logPasswordChanged(playerId, profile.displayName);
    return result;
  });

  app.post('/api/profile/me/avatar', async (request, reply) => {
    const playerId = requireAuth(request);
    const file = await request.file();
    if (!file) {
      throw new ApplicationError('Envie um arquivo de imagem');
    }

    const buffer = await file.toBuffer();
    const result = await deps.uploadAvatar.execute({
      playerId,
      buffer,
      mimetype: file.mimetype,
    });
    const profile = await deps.obterPerfil.execute({ playerId });
    await deps.activityLogger.logAvatarChanged(playerId, profile.displayName);
    return reply.status(201).send(result);
  });

  app.post('/api/profile/favoritos', async (request, reply) => {
    const playerId = requireAuth(request);
    const body = z.object({ gameId: z.string().uuid() }).parse(request.body);
    const profile = await deps.obterPerfil.execute({ playerId });
    const result = await deps.adicionarFavorito.execute({ playerId, gameId: body.gameId });
    await deps.activityLogger.logFavoritesChanged(playerId, profile.displayName, 'add', body.gameId);
    return reply.status(201).send(result);
  });

  app.delete('/api/profile/favoritos/:gameId', async (request) => {
    const playerId = requireAuth(request);
    const { gameId } = z.object({ gameId: z.string().uuid() }).parse(request.params);
    const profile = await deps.obterPerfil.execute({ playerId });
    const result = await deps.removerFavorito.execute({ playerId, gameId });
    await deps.activityLogger.logFavoritesChanged(playerId, profile.displayName, 'remove', gameId);
    return result;
  });
}
