import type { PlayerRank } from '../api/client';

interface RankBadgeProps {
  rank: Pick<PlayerRank, 'id' | 'label' | 'badge' | 'badgeImageUrl'>;
  className?: string;
  showLabel?: boolean;
}

export function RankBadge({ rank, className = '', showLabel = true }: RankBadgeProps) {
  const banned = rank.id === 'banido';

  return (
    <span className={`rank-badge ${banned ? 'rank-badge-banned' : ''} ${className}`.trim()}>
      {rank.badgeImageUrl ? (
        <img src={rank.badgeImageUrl} alt="" className="rank-badge-image" aria-hidden />
      ) : (
        rank.badge && <span className="rank-badge-emoji" aria-hidden>{rank.badge}</span>
      )}
      {showLabel && <span className="rank-badge-label">{rank.label}</span>}
    </span>
  );
}
