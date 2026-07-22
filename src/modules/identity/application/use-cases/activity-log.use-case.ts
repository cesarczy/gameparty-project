import { ForbiddenError, NotFoundError } from '@shared/application/application.error.js';
import { isAdminRole } from '../../domain/value-objects/player-role.vo.js';
import { JogadorId } from '../../domain/value-objects/jogador-id.vo.js';
import type { JogadorRepository } from '../ports/jogador.repository.js';
import type { ActivityLogRepository } from '../ports/activity-log.repository.js';

async function assertAdmin(jogadorRepo: JogadorRepository, requesterId: string) {
  const admin = await jogadorRepo.findById(JogadorId.create(requesterId));
  if (!admin || !isAdminRole(admin.role)) {
    throw new ForbiddenError('Acesso restrito a administradores');
  }
}

export class ListarLogsJogadorAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly activityLogRepo: ActivityLogRepository,
  ) {}

  async execute(input: { requesterId: string; targetPlayerId: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);
    const jogador = await this.jogadorRepo.findById(JogadorId.create(input.targetPlayerId));
    if (!jogador) throw new NotFoundError('Jogador', input.targetPlayerId);

    const logs = await this.activityLogRepo.listBySubject(input.targetPlayerId);
    const grouped = {
      auth: logs.filter((l) => l.category === 'AUTH'),
      profile: logs.filter((l) => l.category === 'PROFILE'),
      admin: logs.filter((l) => l.category === 'ADMIN' && l.subjectId === input.targetPlayerId),
      security: logs.filter((l) => l.category === 'SECURITY' && l.subjectId === input.targetPlayerId),
    };

    return {
      playerId: input.targetPlayerId,
      displayName: jogador.displayName.toString(),
      isBanned: jogador.estaBanido(),
      bannedAt: jogador.bannedAt?.toISOString() ?? null,
      logs,
      grouped,
    };
  }
}

export class ListarLogsGlobaisAdminUseCase {
  constructor(
    private readonly jogadorRepo: JogadorRepository,
    private readonly activityLogRepo: ActivityLogRepository,
  ) {}

  async execute(input: { requesterId: string }) {
    await assertAdmin(this.jogadorRepo, input.requesterId);

    const adminActorIds = (await this.jogadorRepo.listAll())
      .filter((j) => isAdminRole(j.role))
      .map((j) => j.id.toString());

    const logs = await this.activityLogRepo.listByAdminActivity(adminActorIds);

    return {
      logs,
      grouped: {
        auth: logs.filter((l) => l.category === 'AUTH'),
        profile: logs.filter((l) => l.category === 'PROFILE'),
        admin: logs.filter((l) => l.category === 'ADMIN'),
        security: logs.filter((l) => l.category === 'SECURITY'),
      },
    };
  }
}
