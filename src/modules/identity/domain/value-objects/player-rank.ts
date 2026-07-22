import { isAdminRole, type PlayerRole } from './player-role.vo.js';
import { isPrimaryAdminUsername } from './primary-admin.vo.js';

export interface PlayerRank {
  id: string;
  label: string;
  badge: string;
  badgeImageUrl?: string | null;
  minDays: number;
}

export const BANNED_RANK: PlayerRank = {
  id: 'banido',
  label: 'Banido',
  badge: '🚫',
  minDays: 0,
};

/** Insígnia exclusiva do administrador principal (@admin). */
export const PRIMARY_ADMIN_RANK: PlayerRank = {
  id: 'satoru-gojo',
  label: 'Satoru Gojo',
  badge: '',
  badgeImageUrl: '/ranks/satoru-gojo.png',
  minDays: 0,
};

/** Nível manual ou automático para demais contas ADMIN. */
export const ADMIN_RANK: PlayerRank = {
  id: 'administrador',
  label: 'Administrador',
  badge: '🎖️',
  minDays: 0,
};

export const PLAYER_RANKS: PlayerRank[] = [
  { id: 'novato', label: 'Novato', badge: '🌱', minDays: 0 },
  { id: 'iniciante', label: 'Iniciante', badge: '⚔️', minDays: 7 },
  { id: 'intermediario', label: 'Intermediário', badge: '🛡️', minDays: 30 },
  { id: 'veterano', label: 'Veterano', badge: '🏆', minDays: 180 },
  { id: 'lenda', label: 'Lenda', badge: '👑', minDays: 365 },
  { id: 'mestre', label: 'Mestre', badge: '💎', minDays: 730 },
];

export const ALL_RANKS: PlayerRank[] = [...PLAYER_RANKS, ADMIN_RANK];

export function findRankById(id: string): PlayerRank | null {
  if (id === PRIMARY_ADMIN_RANK.id) return PRIMARY_ADMIN_RANK;
  return ALL_RANKS.find((rank) => rank.id === id) ?? null;
}

export function resolvePlayerRank(createdAt: Date, now: Date = new Date()): PlayerRank {
  const days = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  let rank = PLAYER_RANKS[0];
  for (const candidate of PLAYER_RANKS) {
    if (days >= candidate.minDays) rank = candidate;
  }
  return rank;
}

export function resolveJogadorRank(input: {
  createdAt: Date;
  role: PlayerRole | string;
  rankId: string | null;
  isBanned: boolean;
  username?: string;
  now?: Date;
}): PlayerRank {
  if (input.isBanned) return BANNED_RANK;
  if (input.username && isPrimaryAdminUsername(input.username)) return PRIMARY_ADMIN_RANK;
  if (input.rankId) {
    const manual = findRankById(input.rankId);
    if (manual) {
      if (manual.id === PRIMARY_ADMIN_RANK.id) return ADMIN_RANK;
      return manual;
    }
  }
  if (isAdminRole(input.role as PlayerRole)) return ADMIN_RANK;
  return resolvePlayerRank(input.createdAt, input.now);
}

export function rankToDto(rank: PlayerRank) {
  return {
    id: rank.id,
    label: rank.label,
    badge: rank.badge,
    badgeImageUrl: rank.badgeImageUrl ?? null,
    minDays: rank.minDays,
  };
}
