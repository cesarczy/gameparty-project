import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../shared/api/client';
import { ErrorState, Spinner } from '../../../shared/ui';

/** Redireciona /jogos/:slug/lobby → /salas/:roomId */
export function GameLobbyRedirectPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getLobbyBySlug(slug)
      .then((lobby) => navigate(`/salas/${lobby.roomId}`, { replace: true }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Lobby não encontrado'));
  }, [slug, navigate]);

  if (error) {
    return (
      <div className="page-center">
        <ErrorState message={error} />
      </div>
    );
  }

  return (
    <div className="page-center">
      <Spinner />
    </div>
  );
}
