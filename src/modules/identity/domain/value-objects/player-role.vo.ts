export enum PlayerRole {
  PLAYER = 'PLAYER',
  ADMIN = 'ADMIN',
}

export function isAdminRole(role: PlayerRole): boolean {
  return role === PlayerRole.ADMIN;
}
