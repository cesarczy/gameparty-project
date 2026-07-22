import { Link } from 'react-router-dom';

interface PlayerNickProps {
  playerId: string;
  displayName: string;
  className?: string;
  isAdmin?: boolean;
}

export function PlayerNick({ playerId, displayName, className = '', isAdmin = false }: PlayerNickProps) {
  return (
    <Link
      to={`/mensagens/${playerId}`}
      className={`message-author link-nick ${isAdmin ? 'admin' : ''} ${className}`.trim()}
    >
      {displayName}
    </Link>
  );
}
