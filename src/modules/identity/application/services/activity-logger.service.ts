import type { ActivityLogCategory, ActivityLogType } from '@prisma/client';
import type { ActivityLogRepository } from '../ports/activity-log.repository.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import { Email } from '../../domain/value-objects/email.vo.js';

export interface ActivityContext {
  actorId?: string;
  actorName?: string;
  subjectId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class ActivityLogger {
  constructor(
    private readonly repo: ActivityLogRepository,
    private readonly jogadorRepo: JogadorRepository,
  ) {}

  private meta(ctx?: ActivityContext) {
    const base = { ...(ctx?.metadata ?? {}) };
    if (ctx?.ip) base.ip = ctx.ip;
    if (ctx?.userAgent) base.userAgent = ctx.userAgent;
    return Object.keys(base).length > 0 ? base : null;
  }

  async log(
    category: ActivityLogCategory,
    type: ActivityLogType,
    message: string,
    ctx?: ActivityContext,
  ): Promise<void> {
    await this.repo.create({
      category,
      type,
      message,
      subjectId: ctx?.subjectId ?? ctx?.actorId ?? null,
      actorId: ctx?.actorId ?? null,
      actorName: ctx?.actorName ?? null,
      metadata: this.meta(ctx),
    });
  }

  async logLogin(playerId: string, displayName: string, ctx?: ActivityContext): Promise<void> {
    const metadata = this.meta(ctx);
    const last = await this.repo.findLastLoginMetadata(playerId);
    const userAgent = ctx?.userAgent;
    if (userAgent && last?.userAgent && last.userAgent !== userAgent) {
      await this.log('SECURITY', 'NEW_DEVICE_LOGIN', 'Login de um novo dispositivo', {
        ...ctx,
        actorId: playerId,
        actorName: displayName,
        subjectId: playerId,
      });
    }
    await this.log('AUTH', 'LOGIN', 'Login realizado', {
      ...ctx,
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
      metadata: metadata ?? undefined,
    });
  }

  async logLoginFailed(email: string, ctx?: ActivityContext): Promise<void> {
    const jogador = await this.jogadorRepo.findByEmail(Email.create(email));
    if (!jogador) return;

    const subjectId = jogador.id.toString();
    const displayName = jogador.displayName.toString();
    await this.log('AUTH', 'LOGIN_FAILED', 'Tentativa de login com senha incorreta', {
      ...ctx,
      actorId: subjectId,
      actorName: displayName,
      subjectId,
    });

    const failures = await this.repo.countRecentFailedLogins(subjectId);
    if (failures >= 5) {
      await this.log('SECURITY', 'MANY_LOGIN_ATTEMPTS', 'Muitas tentativas de login', {
        ...ctx,
        actorId: subjectId,
        actorName: displayName,
        subjectId,
        metadata: { failures },
      });
    }
  }

  async logLogout(playerId: string, displayName: string, ctx?: ActivityContext): Promise<void> {
    await this.log('AUTH', 'LOGOUT', 'Logout', {
      ...ctx,
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
    });
    await this.log('SECURITY', 'SESSION_ENDED', 'Sessão encerrada', {
      ...ctx,
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
    });
  }

  async logPasswordChanged(playerId: string, displayName: string): Promise<void> {
    await this.log('AUTH', 'PASSWORD_CHANGED', 'Alteração de senha', {
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
    });
  }

  async logEmailVerified(playerId: string, displayName: string): Promise<void> {
    await this.log('AUTH', 'EMAIL_VERIFIED', 'Verificação de e-mail', {
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
    });
  }

  async logDisplayNameChanged(playerId: string, displayName: string, previous: string): Promise<void> {
    await this.log('PROFILE', 'DISPLAY_NAME_CHANGED', 'Alteração do nome', {
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
      metadata: { previous, current: displayName },
    });
  }

  async logAvatarChanged(playerId: string, displayName: string): Promise<void> {
    await this.log('PROFILE', 'AVATAR_CHANGED', 'Alteração da foto', {
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
    });
  }

  async logFavoritesChanged(
    playerId: string,
    displayName: string,
    action: 'add' | 'remove',
    gameId: string,
  ): Promise<void> {
    await this.log('PROFILE', 'FAVORITES_CHANGED', 'Alteração dos jogos favoritos', {
      actorId: playerId,
      actorName: displayName,
      subjectId: playerId,
      metadata: { action, gameId },
    });
  }

  async logUserBanned(
    targetId: string,
    targetName: string,
    adminId: string,
    adminName: string,
    bannedAt: string,
  ): Promise<void> {
    await this.log('PROFILE', 'USER_BANNED', `Usuário banido em ${new Date(bannedAt).toLocaleString('pt-BR')}`, {
      subjectId: targetId,
      actorId: adminId,
      actorName: adminName,
      metadata: { bannedAt },
    });
    await this.log('ADMIN', 'ADMIN_USER_BANNED', `Usuário banido: ${targetName}`, {
      subjectId: targetId,
      actorId: adminId,
      actorName: adminName,
      metadata: { bannedAt },
    });
  }

  async logUserUnbanned(targetId: string, targetName: string, adminId: string, adminName: string): Promise<void> {
    await this.log('ADMIN', 'ADMIN_USER_UNBANNED', `Usuário desbanido: ${targetName}`, {
      subjectId: targetId,
      actorId: adminId,
      actorName: adminName,
    });
  }

  async logRoleChanged(
    targetId: string,
    targetName: string,
    adminId: string,
    adminName: string,
    role: string,
  ): Promise<void> {
    await this.log('ADMIN', 'ADMIN_ROLE_CHANGED', `Cargo alterado para ${role}: ${targetName}`, {
      subjectId: targetId,
      actorId: adminId,
      actorName: adminName,
      metadata: { role },
    });
    await this.log('SECURITY', 'PERMISSIONS_CHANGED', 'Alteração de permissões', {
      subjectId: targetId,
      actorId: adminId,
      actorName: adminName,
      metadata: { role },
    });
  }

  async logAdminPlayerUpdated(
    targetId: string,
    targetName: string,
    adminId: string,
    adminName: string,
    changes: Record<string, { from: unknown; to: unknown }>,
  ): Promise<void> {
    const fields = Object.keys(changes);
    const summary = fields.length > 0 ? fields.join(', ') : 'cadastro';
    await this.log('ADMIN', 'ADMIN_PLAYER_UPDATED', `Cadastro alterado (${targetName}): ${summary}`, {
      subjectId: targetId,
      actorId: adminId,
      actorName: adminName,
      metadata: { changes, targetName },
    });
    await this.log('PROFILE', 'ADMIN_PLAYER_UPDATED', 'Alteração administrativa do cadastro', {
      subjectId: targetId,
      actorId: adminId,
      actorName: adminName,
      metadata: { changes, targetName },
    });
  }

  async logReportReceived(
    reportedId: string,
    reportedName: string,
    reporterId: string,
    reporterName: string,
    reason: string,
  ): Promise<void> {
    await this.log('ADMIN', 'ADMIN_REPORT_RECEIVED', `Denúncia recebida contra ${reportedName}`, {
      subjectId: reportedId,
      actorId: reporterId,
      actorName: reporterName,
      metadata: { reason },
    });
  }

  async logEmailChanged(playerId: string, displayName: string, previous: string, current: string): Promise<void> {
    await this.log('SECURITY', 'EMAIL_CHANGED', 'Alteração de e-mail', {
      subjectId: playerId,
      actorId: playerId,
      actorName: displayName,
      metadata: { previous, current },
    });
  }

  async logGameStatus(gameName: string, active: boolean, adminId: string, adminName: string): Promise<void> {
    await this.log(
      'ADMIN',
      active ? 'GAME_ACTIVATED' : 'GAME_DEACTIVATED',
      active ? `Jogo ativado: ${gameName}` : `Jogo desativado: ${gameName}`,
      { actorId: adminId, actorName: adminName, metadata: { gameName, active } },
    );
  }

  async logCategoryStatus(
    categoryName: string,
    active: boolean,
    adminId: string,
    adminName: string,
  ): Promise<void> {
    await this.log(
      'ADMIN',
      active ? 'CATEGORY_ACTIVATED' : 'CATEGORY_DEACTIVATED',
      active ? `Categoria ativada: ${categoryName}` : `Categoria desativada: ${categoryName}`,
      { actorId: adminId, actorName: adminName, metadata: { categoryName, active } },
    );
  }

  async resolveActor(actorId: string): Promise<{ id: string; name: string }> {
    const jogador = await this.jogadorRepo.findById(JogadorId.create(actorId));
    return {
      id: actorId,
      name: jogador?.displayName.toString() ?? 'Administrador',
    };
  }
}
