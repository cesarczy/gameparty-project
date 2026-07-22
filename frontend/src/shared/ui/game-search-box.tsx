import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, type Game } from '../api/client';

export function GameSearchBox() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }

    const handle = window.setTimeout(() => {
      setLoading(true);
      api.searchGames(query.trim())
        .then((res) => setResults(res.games))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function enterGame(game: Game) {
    setOpen(false);
    setQuery('');
    if (game.lobbyRoomId) {
      navigate(`/salas/${game.lobbyRoomId}`);
      return;
    }
    navigate(`/jogos/${game.slug}/lobby`);
  }

  return (
    <div ref={boxRef} className="game-search">
      <label htmlFor="game-search-input" className="sr-only">Explorar jogos</label>
      <input
        id="game-search-input"
        type="search"
        className="input game-search-input"
        placeholder="Explorar jogos…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && query.trim().length >= 2 && (
        <ul className="game-search-results" role="listbox">
          {loading && <li className="game-search-item muted">Buscando…</li>}
          {!loading && results.length === 0 && (
            <li className="game-search-item muted">Nenhum jogo encontrado.</li>
          )}
          {!loading && results.map((game) => (
            <li key={game.gameId}>
              <button
                type="button"
                className="game-search-item"
                role="option"
                onClick={() => enterGame(game)}
              >
                <span>{game.name}</span>
                <span className="muted small">Entrar no lobby</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
