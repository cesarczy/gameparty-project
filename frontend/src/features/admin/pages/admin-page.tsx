import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type AdminActiveRoom,
  type AdminGame,
  type AdminPanel,
  type AdminPlayer,
  type AdminReport,
  type AdminGlobalLogs,
  type ActivityLogEntry,
  type Category,
} from '../../../shared/api/client';
import { useAuth } from '../../../app/auth-context';
import { AppLayout } from '../../../shared/layout/app-layout';
import { Button, Card, ErrorState, RankBadge, Spinner } from '../../../shared/ui';
import { AdminPlayerEditModal } from '../components/admin-player-edit-modal';
import { AdminGameEditModal } from '../components/admin-game-edit-modal';
import { AdminCategoryEditModal } from '../components/admin-category-edit-modal';
import { AdminReportDetailModal, truncateReportDetails } from '../components/admin-report-detail-modal';
import { AdminGlobalLogsPanel, LOG_TYPE_LABELS } from '../components/admin-activity-logs';
import { AdminListSearch, SortableTh } from '../components/admin-table-tools';
import {
  compareNumber,
  compareText,
  matchesSearch,
  normalizeSearchQuery,
  toggleSortKey,
  type SortDirection,
} from '../lib/admin-table-utils';
import { REPORT_REASONS } from '../../social/components/report-player-modal';

const REASON_LABELS = Object.fromEntries(REPORT_REASONS.map((item) => [item.value, item.label])) as Record<string, string>;

type AdminView =
  | 'usuarios'
  | 'online'
  | 'chats'
  | 'novos-hoje'
  | 'denuncias'
  | 'jogos'
  | 'admins'
  | 'categorias'
  | 'logs';

const LIST_SEARCH_PLACEHOLDERS: Record<AdminView, string> = {
  usuarios: 'Nome, usuário ou e-mail…',
  online: 'Nome, usuário ou e-mail…',
  'novos-hoje': 'Nome, usuário ou e-mail…',
  admins: 'Nome, usuário ou e-mail…',
  chats: 'Filtrar por sala, jogo ou participante…',
  denuncias: 'Filtrar denúncias…',
  jogos: 'Filtrar jogos…',
  categorias: 'Filtrar categorias…',
  logs: 'Filtrar logs…',
};

const VIEW_TITLES: Record<AdminView, string> = {
  usuarios: 'Todos os usuários',
  online: 'Usuários online',
  chats: 'Chats ativos',
  'novos-hoje': 'Novos hoje',
  denuncias: 'Denúncias abertas',
  jogos: 'Jogos cadastrados',
  admins: 'Administradores',
  categorias: 'Categorias',
  logs: 'Logs da plataforma',
};

function isNewToday(createdAt: string): boolean {
  const created = new Date(createdAt);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return created >= start;
}

function filterPlayers(players: AdminPlayer[], view: AdminView): AdminPlayer[] {
  switch (view) {
    case 'online':
      return players.filter((player) => player.isOnline);
    case 'novos-hoje':
      return players.filter((player) => isNewToday(player.createdAt));
    case 'admins':
      return players.filter((player) => player.role === 'ADMIN');
    default:
      return players;
  }
}

function playerStatusLabel(player: AdminPlayer): string {
  if (player.isSystemAccount) return 'Conta do sistema';
  if (player.isBanned) return 'Banido';
  return player.isOnline ? 'Online' : 'Offline';
}

function PlayerLink({
  playerId,
  displayName,
  avatarUrl,
}: {
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
}) {
  return (
    <Link to={`/jogadores/${playerId}`} className="table-user-link">
      <div className="table-user">
        <div className="avatar-preview sm">
          {avatarUrl ? <img src={avatarUrl} alt="" /> : <span>{displayName.slice(0, 1)}</span>}
        </div>
        {displayName}
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`stat-card-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <Card className="stat-card">
        <span className="muted">{label}</span>
        <strong>{value}</strong>
      </Card>
    </button>
  );
}

export function AdminPage() {
  const { updateSession, playerId } = useAuth();
  const detailRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<AdminPanel | null>(null);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [rooms, setRooms] = useState<AdminActiveRoom[]>([]);
  const [games, setGames] = useState<AdminGame[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [view, setView] = useState<AdminView>('usuarios');
  const [editPlayerId, setEditPlayerId] = useState<string | null>(null);
  const [editGameId, setEditGameId] = useState<string | null>(null);
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<AdminReport | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [gameName, setGameName] = useState('');
  const [gameSlug, setGameSlug] = useState('');
  const [gameCategoryId, setGameCategoryId] = useState('');
  const [globalLogs, setGlobalLogs] = useState<AdminGlobalLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  useEffect(() => {
    setListQuery('');
    setSortKey(null);
    setSortDir('asc');
  }, [view]);

  function onSort(nextKey: string) {
    const next = toggleSortKey(sortKey, sortDir, nextKey);
    setSortKey(next.key);
    setSortDir(next.dir);
  }

  async function load() {
    setError(null);
    try {
      const [painel, jogadores, denuncias, salas, jogosAdmin, categorias, logsGlobais] = await Promise.all([
        api.getAdminPanel(),
        api.listAdminPlayers(),
        api.listAdminReports(),
        api.listAdminActiveRooms(),
        api.listAdminGames(),
        api.listAdminCategories(),
        api.listAdminGlobalLogs(),
      ]);
      setPanel(painel);
      setPlayers(jogadores.players);
      setReports(denuncias.reports);
      setRooms(salas.rooms);
      setGames(jogosAdmin.games);
      setCategories(categorias.categories);
      setGlobalLogs(logsGlobais);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar admin');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function selectView(next: AdminView) {
    setView(next);
    window.setTimeout(() => {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }

  async function toggleRole(target: AdminPlayer) {
    const newRole = target.role === 'ADMIN' ? 'PLAYER' : 'ADMIN';
    try {
      const res = await api.setPlayerRole(target.playerId, newRole);
      if (res.token && target.playerId === playerId) {
        updateSession({ role: res.role, token: res.token });
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar permissão');
    }
  }

  async function toggleBan(target: AdminPlayer) {
    const action = target.isBanned ? 'desbanir' : 'banir';
    if (!window.confirm(`Confirma ${action} ${target.displayName}?`)) return;
    try {
      await api.setAdminPlayerBanned(target.playerId, !target.isBanned);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar banimento');
    }
  }

  async function deletePlayer(target: AdminPlayer) {
    if (!window.confirm(`Excluir permanentemente ${target.displayName}? Esta ação não pode ser desfeita.`)) {
      return;
    }
    try {
      await api.deleteAdminPlayer(target.playerId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir jogador');
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createAdminCategory({ name: categoryName.trim(), slug: categorySlug.trim().toLowerCase() });
      setCategoryName('');
      setCategorySlug('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar categoria');
    }
  }

  async function removeCategory(categoryId: string, name: string) {
    if (!window.confirm(`Excluir categoria "${name}"?`)) return;
    try {
      await api.deleteAdminCategory(categoryId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir categoria');
    }
  }

  async function addGame(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.createAdminGame({
        name: gameName.trim(),
        slug: gameSlug.trim().toLowerCase(),
        categoryId: gameCategoryId,
      });
      setGameName('');
      setGameSlug('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar jogo');
    }
  }

  async function removeGame(gameId: string, name: string) {
    if (!window.confirm(`Excluir jogo "${name}"? A sala de lobby também será removida.`)) return;
    try {
      await api.deleteAdminGame(gameId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao excluir jogo');
    }
  }

  async function toggleGameStatus(game: AdminGame) {
    try {
      await api.setAdminGameStatus(game.gameId, !game.active);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar status do jogo');
    }
  }

  async function toggleCategoryStatus(category: Category) {
    try {
      await api.setAdminCategoryStatus(category.categoryId, !(category.active ?? true));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao alterar status da categoria');
    }
  }

  async function loadGlobalLogs() {
    try {
      const res = await api.listAdminGlobalLogs();
      setGlobalLogs(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao carregar logs');
    }
  }

  useEffect(() => {
    if (view === 'logs') {
      loadGlobalLogs();
    }
  }, [view]);

  const filteredPlayers = filterPlayers(players, view);
  const searchQuery = normalizeSearchQuery(listQuery);
  const showUsersTable = view === 'usuarios' || view === 'online' || view === 'novos-hoje' || view === 'admins';

  const playerRows = useMemo(() => {
    let rows = filteredPlayers.filter((player) =>
      matchesSearch(
        searchQuery,
        player.displayName,
        player.username,
        player.email,
        playerStatusLabel(player),
        player.role,
        new Date(player.createdAt).toLocaleDateString('pt-BR'),
      ),
    );

    if (!sortKey) return rows;

    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'displayName':
          return compareText(a.displayName, b.displayName, sortDir);
        case 'username':
          return compareText(a.username, b.username, sortDir);
        case 'email':
          return compareText(a.email, b.email, sortDir);
        case 'status':
          return compareText(playerStatusLabel(a), playerStatusLabel(b), sortDir);
        case 'role':
          return compareText(a.role, b.role, sortDir);
        case 'createdAt':
          return compareText(a.createdAt, b.createdAt, sortDir);
        default:
          return 0;
      }
    });
  }, [filteredPlayers, searchQuery, sortDir, sortKey]);

  const roomRows = useMemo(() => {
    let rows = rooms.filter((room) =>
      matchesSearch(
        searchQuery,
        room.title,
        room.gameName,
        room.gameSlug,
        room.participantCount,
        ...room.participants.map((p) => p.displayName),
      ),
    );
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'title':
          return compareText(a.title, b.title, sortDir);
        case 'gameName':
          return compareText(a.gameName, b.gameName, sortDir);
        case 'participants':
          return compareNumber(a.participantCount, b.participantCount, sortDir);
        default:
          return 0;
      }
    });
  }, [rooms, searchQuery, sortDir, sortKey]);

  const reportRows = useMemo(() => {
    let rows = reports.filter((report) =>
      matchesSearch(
        searchQuery,
        report.reported.displayName,
        report.reporter.displayName,
        REASON_LABELS[report.reason] ?? report.reason,
        report.details,
        new Date(report.createdAt).toLocaleDateString('pt-BR'),
      ),
    );
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'reported':
          return compareText(a.reported.displayName, b.reported.displayName, sortDir);
        case 'reporter':
          return compareText(a.reporter.displayName, b.reporter.displayName, sortDir);
        case 'reason':
          return compareText(
            REASON_LABELS[a.reason] ?? a.reason,
            REASON_LABELS[b.reason] ?? b.reason,
            sortDir,
          );
        case 'details':
          return compareText(a.details ?? '', b.details ?? '', sortDir);
        case 'createdAt':
          return compareText(a.createdAt, b.createdAt, sortDir);
        default:
          return 0;
      }
    });
  }, [reports, searchQuery, sortDir, sortKey]);

  const gameRows = useMemo(() => {
    let rows = games.filter((game) =>
      matchesSearch(searchQuery, game.name, game.slug, game.active ? 'Ativo' : 'Inativo'),
    );
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return compareText(a.name, b.name, sortDir);
        case 'slug':
          return compareText(a.slug, b.slug, sortDir);
        case 'status':
          return compareText(a.active ? 'Ativo' : 'Inativo', b.active ? 'Ativo' : 'Inativo', sortDir);
        default:
          return 0;
      }
    });
  }, [games, searchQuery, sortDir, sortKey]);

  const categoryRows = useMemo(() => {
    let rows = categories.filter((category) =>
      matchesSearch(
        searchQuery,
        category.name,
        category.slug,
        (category.active ?? true) ? 'Ativa' : 'Inativa',
      ),
    );
    if (!sortKey) return rows;
    return [...rows].sort((a, b) => {
      const aActive = a.active ?? true;
      const bActive = b.active ?? true;
      switch (sortKey) {
        case 'name':
          return compareText(a.name, b.name, sortDir);
        case 'slug':
          return compareText(a.slug, b.slug, sortDir);
        case 'status':
          return compareText(aActive ? 'Ativa' : 'Inativa', bActive ? 'Ativa' : 'Inativa', sortDir);
        default:
          return 0;
      }
    });
  }, [categories, searchQuery, sortDir, sortKey]);

  const filteredGlobalLogs = useMemo(() => {
    if (!globalLogs) return null;
    const filterEntry = (entry: ActivityLogEntry) =>
      matchesSearch(
        searchQuery,
        LOG_TYPE_LABELS[entry.type] ?? entry.message,
        entry.message,
        entry.actorName,
        entry.type,
        new Date(entry.createdAt).toLocaleString('pt-BR'),
      );

    const sortEntries = (entries: ActivityLogEntry[]) => {
      const copy = entries.filter(filterEntry);
      if (!sortKey) return copy;
      return [...copy].sort((a, b) => {
        switch (sortKey) {
          case 'message':
            return compareText(
              LOG_TYPE_LABELS[a.type] ?? a.message,
              LOG_TYPE_LABELS[b.type] ?? b.message,
              sortDir,
            );
          case 'actor':
            return compareText(a.actorName ?? '', b.actorName ?? '', sortDir);
          case 'createdAt':
            return compareText(a.createdAt, b.createdAt, sortDir);
          default:
            return 0;
        }
      });
    };

    return {
      grouped: {
        auth: sortEntries(globalLogs.grouped.auth),
        profile: sortEntries(globalLogs.grouped.profile),
        admin: sortEntries(globalLogs.grouped.admin),
        security: sortEntries(globalLogs.grouped.security),
      },
      logs: sortEntries(globalLogs.logs),
    };
  }, [globalLogs, searchQuery, sortDir, sortKey]);

  if (loading) {
    return (
      <AppLayout>
        <div className="content-loading"><Spinner /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <header className="content-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Painel administrativo</h1>
          <p className="muted">Clique nos números abaixo para ver os detalhes de cada métrica.</p>
        </div>
      </header>

      {error && <ErrorState message={error} />}

      {panel && (
        <div className="stats-grid">
          <StatCard
            label="Usuários"
            value={panel.stats.totalPlayers}
            active={view === 'usuarios'}
            onClick={() => selectView('usuarios')}
          />
          <StatCard
            label="Online"
            value={panel.stats.onlinePlayers}
            active={view === 'online'}
            onClick={() => selectView('online')}
          />
          <StatCard
            label="Chats ativos"
            value={panel.stats.activeChats}
            active={view === 'chats'}
            onClick={() => selectView('chats')}
          />
          <StatCard
            label="Novos hoje"
            value={panel.stats.newPlayersToday}
            active={view === 'novos-hoje'}
            onClick={() => selectView('novos-hoje')}
          />
          <StatCard
            label="Denúncias"
            value={panel.stats.openReports}
            active={view === 'denuncias'}
            onClick={() => selectView('denuncias')}
          />
          <StatCard
            label="Jogos"
            value={panel.stats.totalGames}
            active={view === 'jogos'}
            onClick={() => selectView('jogos')}
          />
          <StatCard
            label="Admins"
            value={panel.stats.totalAdmins}
            active={view === 'admins'}
            onClick={() => selectView('admins')}
          />
          <StatCard
            label="Categorias"
            value={panel.stats.totalCategories}
            active={view === 'categorias'}
            onClick={() => selectView('categorias')}
          />
          <StatCard
            label="Logs"
            value={globalLogs?.logs.length ?? 0}
            active={view === 'logs'}
            onClick={() => selectView('logs')}
          />
        </div>
      )}

      <div ref={detailRef}>
        <Card className="table-card">
          <h2>{VIEW_TITLES[view]}</h2>

          <AdminListSearch
            value={listQuery}
            onChange={setListQuery}
            placeholder={LIST_SEARCH_PLACEHOLDERS[view]}
            label={
              view === 'usuarios' || view === 'online' || view === 'novos-hoje' || view === 'admins'
                ? 'Procurar usuário ou jogador'
                : 'Filtrar lista'
            }
          />

          {showUsersTable && (
            <>
              <div className="table-wrap">
                {playerRows.length === 0 ? (
                  <p className="muted empty">Nenhum usuário nesta lista.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <SortableTh label="Nome" active={sortKey === 'displayName'} direction={sortDir} onSort={() => onSort('displayName')} />
                        <SortableTh label="Usuário" active={sortKey === 'username'} direction={sortDir} onSort={() => onSort('username')} />
                        <SortableTh label="E-mail" active={sortKey === 'email'} direction={sortDir} onSort={() => onSort('email')} />
                        <SortableTh label="Status" active={sortKey === 'status'} direction={sortDir} onSort={() => onSort('status')} />
                        <th>Insígnia</th>
                        <SortableTh label="Papel" active={sortKey === 'role'} direction={sortDir} onSort={() => onSort('role')} />
                        <SortableTh label="Cadastro" active={sortKey === 'createdAt'} direction={sortDir} onSort={() => onSort('createdAt')} />
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerRows.map((player) => (
                        <tr key={player.playerId} className={player.isBanned ? 'row-banned' : ''}>
                          <td>
                            <PlayerLink
                              playerId={player.playerId}
                              displayName={player.displayName}
                              avatarUrl={player.avatarUrl}
                            />
                          </td>
                          <td>@{player.username}</td>
                          <td>{player.email}</td>
                          <td>
                            {player.isSystemAccount ? (
                              <span className="status-label system">Conta do sistema</span>
                            ) : player.isBanned ? (
                              <span className="status-label banned">Banido</span>
                            ) : (
                              <>
                                <span className={`presence-dot ${player.isOnline ? 'online' : 'offline'}`} />
                                {player.isOnline ? 'Online' : 'Offline'}
                              </>
                            )}
                          </td>
                          <td>
                            {player.isBanned ? (
                              <RankBadge rank={{ id: 'banido', label: 'Banido', badge: '🚫', badgeImageUrl: null }} />
                            ) : player.rank ? (
                              <RankBadge rank={player.rank} showLabel={false} />
                            ) : (
                              <span className="muted small">—</span>
                            )}
                          </td>
                          <td>
                            <span className={`role-badge ${player.role === 'ADMIN' ? 'admin' : ''}`}>
                              {player.role}
                            </span>
                          </td>
                          <td>{new Date(player.createdAt).toLocaleDateString('pt-BR')}</td>
                          <td>
                            {player.isPrimaryAdmin ? (
                              <span className="muted small"></span>
                            ) : (
                              <div className="admin-row-actions">
                                <Button variant="ghost" className="btn-sm" onClick={() => setEditPlayerId(player.playerId)}>
                                  Alterar
                                </Button>
                                <Button variant="ghost" className="btn-sm" onClick={() => toggleBan(player)}>
                                  {player.isBanned ? 'Desbanir' : 'Banir'}
                                </Button>
                                <Button variant="ghost" className="btn-sm" onClick={() => toggleRole(player)}>
                                  {player.role === 'ADMIN' ? 'Remover admin' : 'Tornar admin'}
                                </Button>
                                <Button variant="ghost" className="btn-sm danger-btn" onClick={() => deletePlayer(player)}>
                                  Excluir
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {view === 'chats' && (
            <div className="table-wrap">
              {roomRows.length === 0 ? (
                <p className="muted empty">Nenhum chat ativo no momento.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortableTh label="Sala" active={sortKey === 'title'} direction={sortDir} onSort={() => onSort('title')} />
                      <SortableTh label="Jogo" active={sortKey === 'gameName'} direction={sortDir} onSort={() => onSort('gameName')} />
                      <SortableTh label="Participantes" active={sortKey === 'participants'} direction={sortDir} onSort={() => onSort('participants')} />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {roomRows.map((room) => (
                      <tr key={room.roomId}>
                        <td>{room.title}</td>
                        <td>
                          <Link to={`/jogos/${room.gameSlug}/lobby`}>{room.gameName}</Link>
                        </td>
                        <td>
                          <div className="admin-participants">
                            {room.participants.map((participant) => (
                              <Link
                                key={participant.playerId}
                                to={`/jogadores/${participant.playerId}`}
                                className="admin-participant-chip"
                              >
                                {participant.displayName}
                              </Link>
                            ))}
                          </div>
                        </td>
                        <td>
                          <Link to={`/salas/${room.roomId}`} className="admin-inline-link">
                            Abrir chat
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {view === 'denuncias' && (
            <div className="table-wrap">
              {reportRows.length === 0 ? (
                <p className="muted empty">Nenhuma denúncia aberta.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortableTh label="Denunciado" active={sortKey === 'reported'} direction={sortDir} onSort={() => onSort('reported')} />
                      <SortableTh label="Denunciante" active={sortKey === 'reporter'} direction={sortDir} onSort={() => onSort('reporter')} />
                      <SortableTh label="Motivo" active={sortKey === 'reason'} direction={sortDir} onSort={() => onSort('reason')} />
                      <SortableTh label="Detalhes" active={sortKey === 'details'} direction={sortDir} onSort={() => onSort('details')} />
                      <SortableTh label="Data" active={sortKey === 'createdAt'} direction={sortDir} onSort={() => onSort('createdAt')} />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((report) => (
                      <tr key={report.reportId}>
                        <td>
                          <Link to={`/jogadores/${report.reported.playerId}`}>
                            {report.reported.displayName}
                          </Link>
                        </td>
                        <td>
                          <Link to={`/jogadores/${report.reporter.playerId}`}>
                            {report.reporter.displayName}
                          </Link>
                        </td>
                        <td>{REASON_LABELS[report.reason] ?? report.reason}</td>
                        <td className="report-details-cell report-details-preview" title={report.details ?? undefined}>
                          {truncateReportDetails(report.details)}
                        </td>
                        <td>{new Date(report.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td>
                          <Button variant="ghost" className="btn-sm" onClick={() => setOpenReport(report)}>
                            Abrir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {view === 'jogos' && (
            <>
              <form className="admin-inline-form" onSubmit={addGame}>
                <input className="input" placeholder="Nome do jogo" value={gameName} onChange={(e) => setGameName(e.target.value)} required />
                <input className="input" placeholder="slug-do-jogo" value={gameSlug} onChange={(e) => setGameSlug(e.target.value.toLowerCase())} required />
                <select className="input" value={gameCategoryId} onChange={(e) => setGameCategoryId(e.target.value)} required>
                  <option value="">Categoria</option>
                  {categories.map((c) => (
                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                  ))}
                </select>
                <Button type="submit">Adicionar jogo</Button>
              </form>
              <div className="table-wrap">
                {gameRows.length === 0 ? (
                  <p className="muted empty">
                    {games.length === 0 ? 'Nenhum jogo cadastrado.' : 'Nenhum jogo corresponde ao filtro.'}
                  </p>
                ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortableTh label="Jogo" active={sortKey === 'name'} direction={sortDir} onSort={() => onSort('name')} />
                      <SortableTh label="Slug" active={sortKey === 'slug'} direction={sortDir} onSort={() => onSort('slug')} />
                      <SortableTh label="Status" active={sortKey === 'status'} direction={sortDir} onSort={() => onSort('status')} />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {gameRows.map((game) => (
                      <tr key={game.gameId}>
                        <td>{game.name}</td>
                        <td>{game.slug}</td>
                        <td>
                          <span className={game.active ? 'status-label online' : 'status-label banned'}>
                            {game.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <Link to={`/jogos/${game.slug}/lobby`} className="admin-inline-link">
                              Ver lobby
                            </Link>
                            <Button variant="ghost" className="btn-sm" onClick={() => setEditGameId(game.gameId)}>
                              Alterar
                            </Button>
                            <Button variant="ghost" className="btn-sm" onClick={() => toggleGameStatus(game)}>
                              {game.active ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button variant="ghost" className="btn-sm danger-btn" onClick={() => removeGame(game.gameId, game.name)}>
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </>
          )}

          {view === 'categorias' && (
            <>
              <form className="admin-inline-form" onSubmit={addCategory}>
                <input className="input" placeholder="Nome da categoria" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required />
                <input className="input" placeholder="slug-da-categoria" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value.toLowerCase())} required />
                <Button type="submit">Adicionar categoria</Button>
              </form>
              <div className="table-wrap">
                {categoryRows.length === 0 ? (
                  <p className="muted empty">
                    {categories.length === 0 ? 'Nenhuma categoria cadastrada.' : 'Nenhuma categoria corresponde ao filtro.'}
                  </p>
                ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortableTh label="Categoria" active={sortKey === 'name'} direction={sortDir} onSort={() => onSort('name')} />
                      <SortableTh label="Slug" active={sortKey === 'slug'} direction={sortDir} onSort={() => onSort('slug')} />
                      <SortableTh label="Status" active={sortKey === 'status'} direction={sortDir} onSort={() => onSort('status')} />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {categoryRows.map((category) => (
                      <tr key={category.categoryId}>
                        <td>{category.name}</td>
                        <td>{category.slug}</td>
                        <td>
                          <span className={(category.active ?? true) ? 'status-label online' : 'status-label banned'}>
                            {(category.active ?? true) ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <Button variant="ghost" className="btn-sm" onClick={() => setEditCategoryId(category.categoryId)}>
                              Alterar
                            </Button>
                            <Button variant="ghost" className="btn-sm" onClick={() => toggleCategoryStatus(category)}>
                              {(category.active ?? true) ? 'Desativar' : 'Ativar'}
                            </Button>
                            <Button variant="ghost" className="btn-sm danger-btn" onClick={() => removeCategory(category.categoryId, category.name)}>
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
            </>
          )}

          {view === 'logs' && filteredGlobalLogs && (
            <>
              <div className="admin-logs-sort-row" role="group" aria-label="Ordenar logs">
                {([
                  ['message', 'Evento'],
                  ['actor', 'Autor'],
                  ['createdAt', 'Data'],
                ] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`sortable-th ${sortKey === key ? 'active' : ''}`}
                    onClick={() => onSort(key)}
                  >
                    <span>{label}</span>
                    {sortKey === key && (
                      <span className="sortable-th-indicator" aria-hidden>{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
              <AdminGlobalLogsPanel grouped={filteredGlobalLogs.grouped} />
            </>
          )}
        </Card>
      </div>

      <AdminPlayerEditModal
        playerId={editPlayerId}
        onClose={() => setEditPlayerId(null)}
        onSaved={load}
      />

      <AdminGameEditModal
        gameId={editGameId}
        onClose={() => setEditGameId(null)}
        onSaved={load}
      />

      <AdminCategoryEditModal
        categoryId={editCategoryId}
        onClose={() => setEditCategoryId(null)}
        onSaved={load}
      />

      <AdminReportDetailModal
        report={openReport}
        onClose={() => setOpenReport(null)}
      />
    </AppLayout>
  );
}
