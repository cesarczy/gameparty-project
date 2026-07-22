import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/auth-context';
import { api, type NotificationItem } from '../api/client';

const TYPE_LABELS: Record<string, string> = {
  AMIZADE: 'Novo amigo',
  MENSAGEM: 'Mensagem',
  CONVITE: 'Convite',
  DENUNCIA: 'Denúncia',
};

const TYPE_ICONS: Record<string, string> = {
  AMIZADE: '👋',
  MENSAGEM: '💬',
  CONVITE: '📩',
  DENUNCIA: '⚠️',
};

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function peerIdFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.senderId === 'string') return p.senderId;
  if (typeof p.requesterId === 'string') return p.requesterId;
  if (typeof p.peerId === 'string') return p.peerId;
  return null;
}

interface NotificationsPanelProps {
  variant?: 'sidebar' | 'inline' | 'fixed';
}

export function NotificationsPanel({ variant = 'sidebar' }: NotificationsPanelProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const load = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.listNotifications();
      setNotifications(res.notifications);
    } catch {
      /* ignore when offline */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
    if (!token) return undefined;
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, [load, token]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  if (!token) return null;

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open) await load();
  }

  async function handleClick(n: NotificationItem) {
    if (!n.read) {
      await api.markNotificationRead(n.id).catch(() => undefined);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
      );
    }

    const peerId = peerIdFromPayload(n.payload);
    setOpen(false);

    if (n.type === 'MENSAGEM' && peerId) {
      navigate(`/mensagens/${peerId}`);
      return;
    }
    if ((n.type === 'AMIZADE' || n.type === 'CONVITE') && peerId) {
      navigate('/conta');
      return;
    }
    navigate('/conta');
  }

  async function markAllRead() {
    const unread = notifications.filter((n) => !n.read);
    await Promise.all(unread.map((n) => api.markNotificationRead(n.id).catch(() => undefined)));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div
      ref={panelRef}
      className={`notifications-panel notifications-panel--${variant}`}
    >
      <button
        type="button"
        className="notifications-trigger"
        onClick={handleOpen}
        aria-expanded={open}
        aria-label={`Notificações${unreadCount ? `, ${unreadCount} não lidas` : ''}`}
      >
        <span className="notifications-bell" aria-hidden>🔔</span>
        {variant === 'sidebar' && <span>Notificações</span>}
        {unreadCount > 0 && (
          <span className="notifications-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notifications-dropdown">
          <div className="notifications-dropdown-header">
            <strong>Notificações</strong>
            {unreadCount > 0 && (
              <button type="button" className="notifications-mark-all" onClick={markAllRead}>
                Marcar todas lidas
              </button>
            )}
          </div>

          <div className="notifications-dropdown-body">
            {loading && notifications.length === 0 && (
              <p className="muted small notifications-empty">Carregando…</p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="muted small notifications-empty">Nenhuma notificação.</p>
            )}
            {notifications.slice(0, 12).map((n) => (
              <button
                key={n.id}
                type="button"
                className={`notification-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => handleClick(n)}
              >
                <span className="notification-icon" aria-hidden>
                  {TYPE_ICONS[n.type] ?? '🔔'}
                </span>
                <span className="notification-content">
                  <span className="notification-type">{TYPE_LABELS[n.type] ?? n.type}</span>
                  <span className="notification-title">{n.title}</span>
                  <span className="notification-body muted small">{n.body}</span>
                </span>
                <span className="notification-time muted small">{formatWhen(n.createdAt)}</span>
              </button>
            ))}
          </div>

          <div className="notifications-dropdown-footer">
            <button type="button" className="notifications-mark-all muted small" onClick={() => setOpen(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
