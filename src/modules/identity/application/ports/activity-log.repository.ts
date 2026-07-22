import type { ActivityLogCategory, ActivityLogType } from '@prisma/client';

export interface ActivityLogEntry {
  logId: string;
  category: ActivityLogCategory;
  type: ActivityLogType;
  message: string;
  subjectId: string | null;
  actorId: string | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateActivityLogInput {
  category: ActivityLogCategory;
  type: ActivityLogType;
  message: string;
  subjectId?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ActivityLogRepository {
  create(input: CreateActivityLogInput): Promise<void>;
  listBySubject(subjectId: string, limit?: number): Promise<ActivityLogEntry[]>;
  listGlobal(categories: ActivityLogCategory[], limit?: number): Promise<ActivityLogEntry[]>;
  listByAdminActivity(adminActorIds: string[], limit?: number): Promise<ActivityLogEntry[]>;
  countRecentFailedLogins(subjectId: string, sinceMinutes?: number): Promise<number>;
  findLastLoginMetadata(subjectId: string): Promise<Record<string, unknown> | null>;
}
