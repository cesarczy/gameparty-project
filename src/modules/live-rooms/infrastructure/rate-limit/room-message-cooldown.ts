import { ApplicationError } from '@shared/application/application.error.js';
import { ROOM_MESSAGE_COOLDOWN_MS } from '../../domain/value-objects/message-content.constants.js';
import type { RoomMessageRateLimit } from '../../application/ports/room-message-rate-limit.port.js';

export class RoomMessageCooldown implements RoomMessageRateLimit {
  private readonly lastSent = new Map<string, number>();

  private key(roomId: string, authorId: string): string {
    return `${roomId}:${authorId}`;
  }

  assertCanSend(roomId: string, authorId: string): void {
    const last = this.lastSent.get(this.key(roomId, authorId));
    if (!last) return;

    const elapsed = Date.now() - last;
    if (elapsed >= ROOM_MESSAGE_COOLDOWN_MS) return;

    const waitSec = Math.ceil((ROOM_MESSAGE_COOLDOWN_MS - elapsed) / 1000);
    throw new ApplicationError(`Aguarde ${waitSec}s para enviar outra mensagem.`);
  }

  record(roomId: string, authorId: string): void {
    this.lastSent.set(this.key(roomId, authorId), Date.now());
  }
}
