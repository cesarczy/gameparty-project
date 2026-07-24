export interface RoomMessageRateLimit {
  assertCanSend(roomId: string, authorId: string): void;
  record(roomId: string, authorId: string): void;
}
