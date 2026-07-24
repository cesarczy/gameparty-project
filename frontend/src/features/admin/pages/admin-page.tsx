import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  api,
  type AdminActiveRoom,
  type AdminGame,
  type AdminPanel,
  type AdminPlayer,
  type AdminReport,
  type AdminGlobalLogs,
  type Category,
} from '../../../shared/api/client';
import { useAuth } from '../../../app/auth-context';
import { AppLayout } from '../../../shared/layout/app-layout';
import { Button, Card, ErrorState, RankBadge, Spinner } from '../../../shared/ui';
import { AdminPlayerEditModal } from '../components/admin-player-edit-modal';
import { AdminGameEditModal } from '../components/admin-game-edit-modal';
import { AdminCategoryEditModal } from '../components/admin-category-edit-modal';
import { AdminPlayerSearch } from '../components/admin-player-search';
import { AdminReportDetailModal, truncateReportDetails } from '../components/admin-report-detail-modal';
import { AdminGlobalLogsPanel } from '../components/admin-activity-logs';
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
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
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
      if (selectedPlayerId === target.playerId) setSelectedPlayerId(null);
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

  if (loading) {
    return (
      <AppLayout>
        <div className="content-loading"><Spinner /></div>
      </AppLayout>
    );
  }

  const filteredPlayers = filterPlayers(players, view);
  const displayedPlayers = selectedPlayerId
    ? filteredPlayers.filter((player) => player.playerId === selectedPlayerId)
    : filteredPlayers;
  const showUsersTable = view === 'usuarios' || view === 'online' || view === 'novos-hoje' || view === 'admins';

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

          {showUsersTable && (
            <>
              <AdminPlayerSearch
                onSelect={(player) => {
                  setSelectedPlayerId(player.playerId);
                  selectView('usuarios');
                }}
              />
              {selectedPlayerId && (
                <p className="admin-filter-banner">
                  Mostrando jogador selecionado.{' '}
                  <button type="button" className="admin-inline-link" onClick={() => setSelectedPlayerId(null)}>
                    Ver todos
                  </button>
                </p>
              )}
              <div className="table-wrap">
                {displayedPlayers.length === 0 ? (
                  <p className="muted empty">Nenhum usuário nesta lista.</p>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Usuário</th>
                        <th>E-mail</th>
                        <th>Status</th>
                        <th>Insígnia</th>
                        <th>Papel</th>
                        <th>Cadastro</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedPlayers.map((player) => (
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
              {rooms.length === 0 ? (
                <p className="muted empty">Nenhum chat ativo no momento.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sala</th>
                      <th>Jogo</th>
                      <th>Participantes</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
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
              {reports.length === 0 ? (
                <p className="muted empty">Nenhuma denúncia aberta.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Denunciado</th>
                      <th>Denunciante</th>
                      <th>Motivo</th>
                      <th>Detalhes</th>
                      <th>Data</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
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
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Jogo</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {games.map((game) => (
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
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Slug</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
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
              </div>
            </>
          )}

          {view === 'logs' && globalLogs && (
            <AdminGlobalLogsPanel grouped={globalLogs.grouped} />
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
