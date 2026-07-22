export interface PlayerProfileSnapshot {
  id: string;
  displayName: string;
}

export interface PlayerProfileReader {
  getProfile(playerId: string): Promise<PlayerProfileSnapshot | null>;
}
