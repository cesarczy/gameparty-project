import type { ActivityLogCategory, ActivityLogType, PrismaClient } from '@prisma/client';
import type {
  ActivityLogRepository,
  ActivityLogEntry,
  CreateActivityLogInput,
} from '../../application/ports/activity-log.repository.js';

function mapRow(row: {
  id: string;
  category: ActivityLogCategory;
  type: ActivityLogType;
  message: string;
  subjectId: string | null;
  actorId: string | null;
  actorName: string | null;
  metadata: unknown;
  createdAt: Date;
}): ActivityLogEntry {
  return {
    logId: row.id,
    category: row.category,
    type: row.type,
    message: row.message,
    subjectId: row.subjectId,
    actorId: row.actorId,
    actorName: row.actorName,
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata as Record<string, unknown> : null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaActivityLogRepository implements ActivityLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateActivityLogInput): Promise<void> {
    await this.prisma.registroAtividade.create({
      data: {
        category: input.category,
        type: input.type,
        message: input.message,
        subjectId: input.subjectId ?? null,
        actorId: input.actorId ?? null,
        actorName: input.actorName ?? null,
        metadata: input.metadata ?? undefined,
      },
    });
  }

  async listBySubject(subjectId: string, limit = 100): Promise<ActivityLogEntry[]> {
    const rows = await this.prisma.registroAtividade.findMany({
      where: {
        subjectId,
        category: { in: ['AUTH', 'PROFILE', 'ADMIN', 'SECURITY'] },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapRow);
  }

  async listGlobal(categories: ActivityLogCategory[], limit = 150): Promise<ActivityLogEntry[]> {
    const rows = await this.prisma.registroAtividade.findMany({
      where: { category: { in: categories } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapRow);
  }

  async listByAdminActivity(adminActorIds: string[], limit = 200): Promise<ActivityLogEntry[]> {
    const rows = await this.prisma.registroAtividade.findMany({
      where: {
        OR: [
          { category: { in: ['ADMIN', 'SECURITY'] } },
          ...(adminActorIds.length > 0
            ? [{
                actorId: { in: adminActorIds },
                category: { in: ['AUTH', 'PROFILE'] as ActivityLogCategory[] },
              }]
            : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapRow);
  }

  async countRecentFailedLogins(subjectId: string, sinceMinutes = 15): Promise<number> {
    const since = new Date(Date.now() - sinceMinutes * 60 * 1000);
    return this.prisma.registroAtividade.count({
      where: {
        subjectId,
        type: 'LOGIN_FAILED',
        createdAt: { gte: since },
      },
    });
  }

  async findLastLoginMetadata(subjectId: string): Promise<Record<string, unknown> | null> {
    const row = await this.prisma.registroAtividade.findFirst({
      where: { subjectId, type: 'LOGIN' },
      orderBy: { createdAt: 'desc' },
      select: { metadata: true },
    });
    if (!row?.metadata || typeof row.metadata !== 'object') return null;
    return row.metadata as Record<string, unknown>;
  }
}
