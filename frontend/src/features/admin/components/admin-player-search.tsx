import { useEffect, useRef, useState } from 'react';
import { api, type AdminPlayerSearchResult } from '../../../shared/api/client';

interface AdminPlayerSearchProps {
  onSelect: (player: AdminPlayerSearchResult) => void;
}

export function AdminPlayerSearch({ onSelect }: AdminPlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AdminPlayerSearchResult[]>([]);
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
      api.searchAdminPlayers(query.trim())
        .then((res) => setResults(res.players))
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

  function selectPlayer(player: AdminPlayerSearchResult) {
    onSelect(player);
    setQuery('');
    setOpen(false);
    setResults([]);
  }

  return (
    <div ref={boxRef} className="game-search admin-player-search">
      <label htmlFor="admin-player-search-input" className="label">
        Procurar usuário ou jogador
      </label>
      <input
        id="admin-player-search-input"
        type="search"
        className="input game-search-input"
        placeholder="Nome, usuário ou e-mail…"
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
            <li className="game-search-item muted">Nenhum jogador encontrado.</li>
          )}
          {!loading && results.map((player) => (
            <li key={player.playerId}>
              <button
                type="button"
                className="game-search-item"
                role="option"
                onClick={() => selectPlayer(player)}
              >
                <span>
                  {player.displayName}
                  <span className="muted small"> @{player.username}</span>
                  {player.isBanned && <span className="role-badge banned">Banido</span>}
                </span>
                <span className="muted small">{player.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
