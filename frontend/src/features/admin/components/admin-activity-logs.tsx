import { useEffect, useState } from 'react';
import { api, type ActivityLogEntry, type AdminPlayerLogs } from '../../../shared/api/client';
import { Card, Spinner } from '../../../shared/ui';

export const LOG_TYPE_LABELS: Record<string, string> = {
  LOGIN: 'Login realizado',
  LOGOUT: 'Logout',
  LOGIN_FAILED: 'Tentativa de login com senha incorreta',
  PASSWORD_CHANGED: 'Alteração de senha',
  PASSWORD_RECOVERY: 'Recuperação de senha',
  EMAIL_VERIFIED: 'Verificação de e-mail',
  DISPLAY_NAME_CHANGED: 'Alteração do nome',
  AVATAR_CHANGED: 'Alteração da foto',
  FAVORITES_CHANGED: 'Alteração dos jogos favoritos',
  USER_BANNED: 'Usuário banido',
  ADMIN_USER_BANNED: 'Usuário banido',
  ADMIN_USER_UNBANNED: 'Usuário desbanido',
  ADMIN_ROLE_CHANGED: 'Cargo alterado',
  ADMIN_PLAYER_UPDATED: 'Cadastro alterado pelo admin',
  ADMIN_REPORT_RECEIVED: 'Denúncia recebida',
  EMAIL_CHANGED: 'Alteração de e-mail',
  PERMISSIONS_CHANGED: 'Alteração de permissões',
  NEW_DEVICE_LOGIN: 'Login de um novo dispositivo',
  MANY_LOGIN_ATTEMPTS: 'Muitas tentativas de login',
  SESSION_ENDED: 'Sessão encerrada',
  GAME_DEACTIVATED: 'Jogo desativado',
  GAME_ACTIVATED: 'Jogo ativado',
  CATEGORY_DEACTIVATED: 'Categoria desativada',
  CATEGORY_ACTIVATED: 'Categoria ativada',
};

const SECTION_TITLES: Record<string, string> = {
  auth: 'Logs de autenticação',
  profile: 'Logs de perfil',
  admin: 'Logs administrativos',
  security: 'Logs de segurança',
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString('pt-BR');
}

function LogList({ items }: { items: ActivityLogEntry[] }) {
  if (items.length === 0) {
    return <p className="muted empty">Nenhum registro nesta seção.</p>;
  }

  return (
    <ul className="activity-log-list">
      {items.map((item) => (
        <li key={item.logId} className="activity-log-item">
          <div className="activity-log-main">
            <strong>{LOG_TYPE_LABELS[item.type] ?? item.message}</strong>
            {LOG_TYPE_LABELS[item.type] && item.message !== LOG_TYPE_LABELS[item.type] && (
              <span className="muted small">{item.message}</span>
            )}
          </div>
          <div className="activity-log-meta muted small">
            {item.actorName && <span>{item.actorName}</span>}
            <time dateTime={item.createdAt}>{formatWhen(item.createdAt)}</time>
          </div>
        </li>
      ))}
    </ul>
  );
}

interface AdminPlayerLogsPanelProps {
  playerId: string;
}

export function AdminPlayerLogsPanel({ playerId }: AdminPlayerLogsPanelProps) {
  const [data, setData] = useState<AdminPlayerLogs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.listAdminPlayerLogs(playerId)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar logs'))
      .finally(() => setLoading(false));
  }, [playerId]);

  if (loading) return <div className="content-loading"><Spinner /></div>;
  if (error) return <p className="error">{error}</p>;
  if (!data) return null;

  const sections = ['auth', 'profile', 'admin', 'security'] as const;

  return (
    <Card className="activity-log-card" id="logs-admin">
      <h2>Logs do usuário</h2>
      {data.isBanned && (
        <p className="admin-filter-banner">
          Usuário banido{data.bannedAt ? ` em ${formatWhen(data.bannedAt)}` : ''}
        </p>
      )}

      {sections.map((section) => {
        const items = data.grouped[section];
        if (items.length === 0) return null;
        return (
          <section key={section} className="activity-log-section">
            <h3>{SECTION_TITLES[section]}</h3>
            <LogList items={items} />
          </section>
        );
      })}

      {data.logs.length === 0 && !data.isBanned && (
        <p className="muted empty">Nenhuma atividade registrada ainda.</p>
      )}
    </Card>
  );
}

interface AdminGlobalLogsPanelProps {
  grouped: {
    auth: ActivityLogEntry[];
    profile: ActivityLogEntry[];
    admin: ActivityLogEntry[];
    security: ActivityLogEntry[];
  };
}

export function AdminGlobalLogsPanel({ grouped }: AdminGlobalLogsPanelProps) {
  const sections = ['auth', 'profile', 'admin', 'security'] as const;
  const hasAny = sections.some((key) => grouped[key].length > 0);

  if (!hasAny) {
    return <p className="muted empty">Nenhuma atividade de administradores registrada ainda.</p>;
  }

  return (
    <>
      {sections.map((section) => (
        grouped[section].length > 0 && (
          <section key={section} className="activity-log-section">
            <h3>{SECTION_TITLES[section]}</h3>
            <LogList items={grouped[section]} />
          </section>
        )
      ))}
    </>
  );
}
