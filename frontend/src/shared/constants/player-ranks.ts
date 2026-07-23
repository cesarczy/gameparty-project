import type { PlayerRank } from '../api/client';

export const PLAYER_RANK_OPTIONS: PlayerRank[] = [
  { id: 'novato', label: 'Novato', badge: '🌱', badgeImageUrl: null, minDays: 0 },
  { id: 'iniciante', label: 'Iniciante', badge: '⚔️', badgeImageUrl: null, minDays: 7 },
  { id: 'intermediario', label: 'Intermediário', badge: '🛡️', badgeImageUrl: null, minDays: 30 },
  { id: 'veterano', label: 'Veterano', badge: '🏆', badgeImageUrl: null, minDays: 180 },
  { id: 'lenda', label: 'Lenda', badge: '👑', badgeImageUrl: null, minDays: 365 },
  { id: 'mestre', label: 'Mestre', badge: '💎', badgeImageUrl: null, minDays: 730 },
];

export const PRIMARY_ADMIN_RANK_OPTION: PlayerRank = {
  id: 'satoru-gojo',
  label: 'Satoru Gojo',
  badge: '',
  badgeImageUrl: '/ranks/satoru-gojo.png',
  minDays: 0,
};

export const ADMIN_RANK_OPTION: PlayerRank = {
  id: 'administrador',
  label: 'Administrador',
  badge: '🎖️',
  badgeImageUrl: null,
  minDays: 0,
};

export const ALL_RANK_OPTIONS: PlayerRank[] = [...PLAYER_RANK_OPTIONS, ADMIN_RANK_OPTION];

export const AUTO_RANK_VALUE = '__auto__';

export function isPrimaryAdminUsername(username: string): boolean {
  return username.trim().toLowerCase() === 'admin';
}

export function findRankOption(id: string | null | undefined): PlayerRank | null {
  if (!id) return null;
  if (id === PRIMARY_ADMIN_RANK_OPTION.id) return PRIMARY_ADMIN_RANK_OPTION;
  return ALL_RANK_OPTIONS.find((rank) => rank.id === id) ?? null;
}
