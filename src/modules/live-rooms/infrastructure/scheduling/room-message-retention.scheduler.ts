import type { FastifyBaseLogger } from 'fastify';
import type { PurgeOldRoomMessagesUseCase } from '../../application/use-cases/purge-old-room-messages.use-case.js';

const MS_PER_HOUR = 60 * 60 * 1000;
const STARTUP_DELAY_MS = 60_000;

export interface RoomMessageRetentionSchedule {
  stop: () => void;
}

export function scheduleRoomMessageRetention(
  log: FastifyBaseLogger,
  purge: PurgeOldRoomMessagesUseCase,
  options: { retentionDays: number; intervalHours: number },
): RoomMessageRetentionSchedule | null {
  if (options.retentionDays <= 0) {
    log.info('Retenção de mensagens de sala desativada (ROOM_MESSAGE_RETENTION_DAYS=0)');
    return null;
  }

  let intervalId: ReturnType<typeof setInterval> | undefined;
  let startupTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let running = false;

  async function runPurge(trigger: 'startup' | 'interval') {
    if (running) return;
    running = true;
    try {
      const result = await purge.execute({ retentionDays: options.retentionDays });
      if (result.deletedCount > 0 || trigger === 'startup') {
        log.info(
          {
            deletedCount: result.deletedCount,
            cutoff: result.cutoff,
            retentionDays: options.retentionDays,
            trigger,
          },
          'Limpeza de mensagens de sala concluída',
        );
      }
    } catch (err) {
      log.error({ err }, 'Falha na limpeza de mensagens de sala');
    } finally {
      running = false;
    }
  }

  startupTimeoutId = setTimeout(() => {
    void runPurge('startup');
  }, STARTUP_DELAY_MS);

  intervalId = setInterval(() => {
    void runPurge('interval');
  }, options.intervalHours * MS_PER_HOUR);

  log.info(
    {
      retentionDays: options.retentionDays,
      intervalHours: options.intervalHours,
    },
    'Agendador de retenção de mensagens de sala ativo',
  );

  return {
    stop: () => {
      if (startupTimeoutId) clearTimeout(startupTimeoutId);
      if (intervalId) clearInterval(intervalId);
    },
  };
}
