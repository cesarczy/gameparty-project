import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { api, connectRoomSocket, connectPrivateMessageSocket, isSessionInvalidError, type ChatMessage, type RoomInfo } from '../../../shared/api/client';
import { useAuth } from '../../../app/auth-context';
import { filterProfanity } from '../../../shared/utils/profanity-filter';
import { Button, Card, ErrorState, GameCover, Input, Label, PlayerNick, RankBadge, Spinner, BackLink } from '../../../shared/ui';
import { ReportPlayerModal } from '../../social/components/report-player-modal';
import { AdminPlayerLogsPanel } from '../../admin/components/admin-activity-logs';

export function RoomPage() {
  const { roomId = '' } = useParams();
  const navigate = useNavigate();
  const { token, displayName, playerId, sessionReady, logout, isAdmin } = useAuth();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [profanityFilter, setProfanityFilter] = useState(true);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const joinKeyRef = useRef<string | null>(null);

  useEffect(() => {
    joinKeyRef.current = null;
    setJoined(false);
    setError(null);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    api.getRoom(roomId).then(setRoom).catch((e) => setError(e.message));
    api.listRoomMessages(roomId)
      .then((res) => setMessages(res.messages.map((m) => ({ ...m, type: 'message' as const }))))
      .catch(() => undefined);
    api.getProfile()
      .then((p) => setProfanityFilter(p.profanityFilterEnabled))
      .catch(() => undefined);
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !token || !sessionReady) return;

    const joinKey = `${roomId}:${token}`;
    if (joinKeyRef.current === joinKey) return;
    joinKeyRef.current = joinKey;

    let cancelled = false;
    api.joinRoom(roomId)
      .then((res) => {
        if (!cancelled) {
          setJoined(true);
          setError(null);
          setRoom((prev) => (prev ? { ...prev, participantCount: res.participantCount } : prev));
        }
      })
      .catch((e) => {
        if (cancelled) return;
        joinKeyRef.current = null;
        if (isSessionInvalidError(e)) {
          logout();
          navigate('/login', { replace: true, state: { from: `/salas/${roomId}` } });
          return;
        }
        const msg = e instanceof Error ? e.message : 'Erro ao entrar na sala';
        if (msg.includes('já está na sala')) {
          setJoined(true);
          setError(null);
          return;
        }
        setError(msg);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, token, sessionReady, logout, navigate]);

  useEffect(() => {
    if (!roomId || !token || !joined) return undefined;
    return () => {
      api.leaveRoom(roomId).catch(() => undefined);
    };
  }, [roomId, token, joined]);

  useEffect(() => {
    if (!roomId) return;
    const ws = connectRoomSocket(roomId, (event) => {
      if (event.type === 'participantCount') {
        setRoom((prev) => (prev ? { ...prev, participantCount: event.participantCount } : prev));
        return;
      }
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === event.messageId)) return prev;
        return [...prev, event];
      });
    });
    return () => ws.close();
  }, [roomId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  function displayContent(text: string) {
    return profanityFilter ? filterProfanity(text) : text;
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    try {
      const msg = await api.sendMessage(roomId, content.trim());
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === msg.messageId)) return prev;
        return [...prev, { ...msg, type: 'message' }];
      });
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    }
  }

  return (
    <div className="chat-page">
      <header className="content-header">
        <div className="room-header-main">
          <BackLink to="/">Voltar ao lobby</BackLink>
          <div className="room-title-row">
            {room?.coverUrl && (
              <GameCover name={room.gameName} src={room.coverUrl} className="room-cover-thumb" />
            )}
            <div>
              <h1>{room?.gameName ?? 'Carregando…'}</h1>
              <p className="muted">{room?.title ?? 'Sala de chat'}</p>
              <p className="muted small">
                {displayName ? `Conectado como ${displayName}` : 'Chat ao vivo'}
                {room ? ` · ${room.participantCount} online na sala` : ''}
              </p>
            </div>
          </div>
        </div>
        <div className="room-header-actions">
          <span className={`stat-pill ${joined ? 'online' : ''}`}>{joined ? 'Online' : 'Entrando…'}</span>
        </div>
      </header>

      {error && <ErrorState message={error} />}

      <Card className="chat-box">
        <div className="messages" ref={listRef}>
          {messages.length === 0 && <p className="muted">Nenhuma mensagem ainda. Dê o play!</p>}
          {messages.map((m) => (
            <div key={m.messageId} className="message">
              {m.authorId === playerId ? (
                <span className={`message-author self ${isAdmin ? 'admin' : ''}`}>{m.authorDisplayName ?? displayName}</span>
              ) : (
                <PlayerNick
                  playerId={m.authorId}
                  displayName={m.authorDisplayName ?? 'Jogador'}
                  isAdmin={m.authorRole === 'ADMIN'}
                />
              )}
              <span className="message-text">{displayContent(m.content)}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="chat-form">
          <Label htmlFor="content" className="sr-only">Mensagem</Label>
          <Input
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Digite sua mensagem…"
            maxLength={2000}
          />
          <Button type="submit">Enviar</Button>
        </form>
      </Card>
    </div>
  );
}

export function DmPage() {
  const { peerId = '' } = useParams();
  const { playerId, displayName } = useAuth();
  const [peer, setPeer] = useState<{ displayName: string; isOnline: boolean } | null>(null);
  const [messages, setMessages] = useState<Array<{ messageId: string; senderId: string; content: string; sentAt: string; senderDisplayName: string }>>([]);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!peerId) return;
    Promise.all([api.getPublicProfile(peerId), api.listPrivateMessages(peerId)])
      .then(([profile, msgs]) => {
        setPeer({ displayName: profile.displayName, isOnline: profile.isOnline });
        setMessages(msgs.messages);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [peerId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    if (!peerId) return undefined;
    const ws = connectPrivateMessageSocket((msg) => {
      const inConversation = msg.senderId === peerId || msg.receiverId === peerId;
      if (!inConversation) return;
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === msg.messageId)) return prev;
        return [...prev, {
          messageId: msg.messageId,
          senderId: msg.senderId,
          content: msg.content,
          sentAt: msg.sentAt,
          senderDisplayName: msg.senderDisplayName,
        }];
      });
    });
    return () => ws.close();
  }, [peerId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      const msg = await api.sendPrivateMessage(peerId, content.trim());
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === msg.messageId)) return prev;
        return [...prev, msg];
      });
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar');
    }
  }

  if (loading) {
    return <div className="content-loading"><Spinner /></div>;
  }

  return (
    <div className="chat-page">
      <header className="content-header">
        <div>
          <BackLink to="/conta">Minha conta</BackLink>
          <div className="profile-status-row">
            <h1>{peer?.displayName ?? 'Conversa'}</h1>
            <span className={`presence-dot ${peer?.isOnline ? 'online' : 'offline'}`} title={peer?.isOnline ? 'Online' : 'Offline'} />
          </div>
        </div>
        <div className="room-header-actions">
          {peerId !== playerId && (
            <div className="inline-actions">
              <Button variant="ghost" className="btn-sm" onClick={() => api.addFriend(peerId).catch((e) => setError(e.message))}>
                Adicionar amigo
              </Button>
              <Button variant="ghost" className="btn-sm" onClick={() => setReportOpen(true)}>
                Denunciar
              </Button>
              <Button variant="ghost" className="btn-sm" onClick={() => api.blockPlayer(peerId).then(() => setError('Usuário bloqueado.')).catch((e) => setError(e.message))}>
                Bloquear
              </Button>
            </div>
          )}
        </div>
      </header>

      {error && <ErrorState message={error} />}

      <Card className="chat-box">
        <div className="messages" ref={listRef}>
          {messages.map((m) => (
            <div key={m.messageId} className={`message ${m.senderId === playerId ? 'own' : ''}`}>
              <span className="message-author">{m.senderDisplayName}</span>
              <span className="message-text">{m.content}</span>
            </div>
          ))}
        </div>
        <form onSubmit={handleSend} className="chat-form">
          <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder={`Mensagem para ${peer?.displayName ?? 'jogador'}…`} maxLength={2000} />
          <Button type="submit">Enviar</Button>
        </form>
      </Card>

      <ReportPlayerModal
        reportedId={peerId}
        reportedName={peer?.displayName ?? 'jogador'}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}

export function PublicProfilePage() {
  const { playerId = '' } = useParams();
  const { playerId: me, isAdmin } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof api.getPublicProfile>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    api.getPublicProfile(playerId)
      .then(setProfile)
      .catch((e) => setError(e.message));
  }, [playerId]);

  if (error) return <ErrorState message={error} />;
  if (!profile) return <div className="content-loading"><Spinner /></div>;

  return (
    <div className="profile-public">
      <header className="content-header">
        <div>
          <BackLink to="/">Voltar</BackLink>
          <div className="profile-public-card">
            <div className="avatar-preview lg">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : <span>{profile.displayName.slice(0, 1)}</span>}
            </div>
            <div>
              <div className="profile-status-row">
                <h1>{profile.displayName}</h1>
                <span className={`presence-dot ${profile.isOnline ? 'online' : 'offline'}`} />
                <span className={`presence-label ${profile.isOnline ? 'online' : 'offline'}`}>
                  {profile.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <RankBadge
                rank={profile.rank}
                className={profile.isBanned ? 'rank-badge-banned' : ''}
              />
              <p className="muted small">Membro desde {new Date(profile.createdAt).toLocaleDateString('pt-BR')}</p>
              {me && me !== playerId && !profile.isBanned && (
                <div className="inline-actions">
                  <Link to={`/mensagens/${playerId}`}><Button>Enviar mensagem</Button></Link>
                  <Button variant="ghost" onClick={() => api.addFriend(playerId)}>Adicionar amigo</Button>
                  <Button variant="ghost" onClick={() => setReportOpen(true)}>Denunciar</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {isAdmin && <AdminPlayerLogsPanel playerId={playerId} />}

      <ReportPlayerModal
        reportedId={playerId}
        reportedName={profile.displayName}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
