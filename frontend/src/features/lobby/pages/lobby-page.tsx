import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Category, type Game } from '../../../shared/api/client';
import { useAuth } from '../../../app/auth-context';
import { AppLayout } from '../../../shared/layout/app-layout';
import { Card, ErrorState, GameCover, Spinner } from '../../../shared/ui';

export function LobbyPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [games, setGames] = useState<Game[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listCategories()
      .then((res) => {
        setCategories(res.categories);
        if (res.categories[0]) {
          setSelectedCategory(res.categories[0].categoryId);
          setSelectedCategoryName(res.categories[0].name);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));

    if (token) {
      api.getProfile()
        .then((p) => setFavorites(p.favoritos))
        .catch(() => undefined);
    }
  }, [token]);

  useEffect(() => {
    if (!selectedCategory) return;
    const cat = categories.find((c) => c.categoryId === selectedCategory);
    if (cat) setSelectedCategoryName(cat.name);
    api.listGamesByCategory(selectedCategory)
      .then((res) => setGames(res.games))
      .catch((e) => setError(e.message));
  }, [selectedCategory, categories]);

  function enterLobby(game: Game) {
    if (!token) {
      navigate('/login');
      return;
    }
    if (game.lobbyRoomId) {
      navigate(`/salas/${game.lobbyRoomId}`);
      return;
    }
    navigate(`/jogos/${game.slug}/lobby`);
  }

  async function toggleFavorite(e: React.MouseEvent, game: Game) {
    e.stopPropagation();
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      if (favorites.includes(game.gameId)) {
        await api.removeFavorite(game.gameId);
        setFavorites((prev) => prev.filter((id) => id !== game.gameId));
      } else {
        await api.addFavorite(game.gameId);
        setFavorites((prev) => [...prev, game.gameId]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao favoritar');
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="content-loading"><Spinner /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      categories={categories}
      selectedCategory={selectedCategory}
      onSelectCategory={setSelectedCategory}
    >
      <header className="content-header">
        <div>
          <p className="eyebrow">Lobby</p>
          <h1>{selectedCategoryName || 'Jogos'}</h1>
          <p className="muted">Escolha um jogo e entre no chat ao vivo da comunidade.</p>
        </div>
        <div className="stat-pill">{games.length} jogos</div>
      </header>

      {error && <ErrorState message={error} />}

      <div className="game-grid">
        {games.map((g) => (
          <button key={g.gameId} type="button" className="game-card" onClick={() => enterLobby(g)}>
            <div className="game-card-cover">
              <GameCover name={g.name} src={g.coverUrl} />
            </div>
            <div className="game-card-body">
              <div className="game-card-top">
                <span className="game-card-badge">Online</span>
                <button
                  type="button"
                  className={`favorite-btn ${favorites.includes(g.gameId) ? 'active' : ''}`}
                  onClick={(e) => toggleFavorite(e, g)}
                  aria-label="Favoritar jogo"
                >
                  ★
                </button>
              </div>
              <strong>{g.name}</strong>
              <span className="muted">Entrar no lobby</span>
            </div>
          </button>
        ))}
      </div>

      {games.length === 0 && (
        <Card><p className="muted">Nenhum jogo nesta categoria.</p></Card>
      )}
    </AppLayout>
  );
}
