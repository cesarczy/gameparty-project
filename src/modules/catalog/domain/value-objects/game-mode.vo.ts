export enum GameMode {
  ONLINE = 'ONLINE',
  CAMPANHA = 'CAMPANHA',
}

export const GAME_MODES = [GameMode.ONLINE, GameMode.CAMPANHA] as const;
