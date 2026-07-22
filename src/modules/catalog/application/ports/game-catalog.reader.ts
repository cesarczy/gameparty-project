export interface GameSnapshot {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  supportedModes: string[];
}

export interface GameCatalogReader {
  exists(gameId: string): Promise<boolean>;
  getSnapshot(gameId: string): Promise<GameSnapshot | null>;
  supportsMode(gameId: string, mode: string): Promise<boolean>;
}
