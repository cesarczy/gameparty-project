import type { WebSocket } from '@fastify/websocket';

export type PrivateMessageBroadcast = {
  type: 'privateMessage';
  messageId: string;
  senderId: string;
  receiverId: string;
  senderDisplayName: string;
  content: string;
  sentAt: string;
};

export class PrivateMessageHub {
  private readonly players = new Map<string, Set<WebSocket>>();

  join(playerId: string, socket: WebSocket): void {
    let clients = this.players.get(playerId);
    if (!clients) {
      clients = new Set();
      this.players.set(playerId, clients);
    }
    clients.add(socket);
    socket.on('close', () => this.leave(playerId, socket));
  }

  leave(playerId: string, socket: WebSocket): void {
    const clients = this.players.get(playerId);
    if (!clients) return;
    clients.delete(socket);
    if (clients.size === 0) {
      this.players.delete(playerId);
    }
  }

  sendTo(playerId: string, payload: PrivateMessageBroadcast): void {
    const clients = this.players.get(playerId);
    if (!clients) return;
    const data = JSON.stringify(payload);
    for (const client of clients) {
      if (client.readyState === client.OPEN) {
        client.send(data);
      }
    }
  }

  notifyMessage(payload: PrivateMessageBroadcast): void {
    this.sendTo(payload.senderId, payload);
    this.sendTo(payload.receiverId, payload);
  }
}
