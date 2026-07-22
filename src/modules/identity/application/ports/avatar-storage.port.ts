export interface AvatarFileInput {
  buffer: Buffer;
  mimetype: string;
}

export interface AvatarStorage {
  save(playerId: string, file: AvatarFileInput): Promise<string>;
}
