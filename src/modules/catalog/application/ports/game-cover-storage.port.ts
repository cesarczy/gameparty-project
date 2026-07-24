export interface GameCoverFileInput {
  buffer: Buffer;
  mimetype: string;
}

export interface GameCoverStorage {
  save(gameId: string, file: GameCoverFileInput): Promise<string>;
}
