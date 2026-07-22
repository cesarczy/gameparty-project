import type { WebSocket } from '@fastify/websocket';

export type ChatBroadcastPayload =
  | {
      type: 'message';
      messageId: string;
      roomId: string;
      authorId: string;
      authorDisplayName?: string;
      authorRole?: string;
      authorAvatarUrl?: string | null;
      content: string;
      sentAt: string;
    }
  | {
      type: 'participantCount';
      roomId: string;
      participantCount: number;
    };

export class ChatRoomHub {
  private readonly rooms = new Map<string, Set<WebSocket>>();

  join(roomId: string, socket: WebSocket): void {
    let clients = this.rooms.get(roomId);
    if (!clients) {
      clients = new Set();
      this.rooms.set(roomId, clients);
    }
    clients.add(socket);
    socket.on('close', () => this.leave(roomId, socket));
  }

  leave(roomId: string, socket: WebSocket): void {
    const clients = this.rooms.get(roomId);
    if (!clients) return;
    clients.delete(socket);
    if (clients.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  broadcast(roomId: string, payload: ChatBroadcastPayload): void {
    const clients = this.rooms.get(roomId);
    if (!clients) return;
    const data = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  }
}
